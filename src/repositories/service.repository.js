import prisma from '../config/db.js';

class ServiceRepository {
  /**
   * Find a service by ID and organization ID
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async findById(id, organizationId) {
    return prisma.service.findFirst({
      where: { id, organizationId },
      include: {
        group: true,
        serviceTags: {
          include: { tag: true },
        },
      },
    });
  }

  /**
   * List all services in an organization with filters and pagination
   * @param {string} organizationId 
   * @param {Object} query 
   * @param {number} query.page
   * @param {number} query.limit
   * @param {string} [query.groupId]
   * @param {string} [query.search]
   */
  static async findMany(organizationId, { page = 1, limit = 10, groupId, search } = {}) {
    const skip = (page - 1) * limit;
    
    const where = {
      organizationId,
    };

    if (groupId) {
      where.groupId = groupId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          group: true,
          serviceTags: {
            include: { tag: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.count({ where }),
    ]);

    return { services, total };
  }

  /**
   * Create a new service and build tags mapping inside a transaction
   * @param {string} organizationId 
   * @param {Object} data 
   * @param {string[]} tagNames 
   */
  static async create(organizationId, data, tagNames = []) {
    return prisma.$transaction(async (tx) => {
      // 1. Resolve or create tags
      const tagIds = [];
      for (const name of tagNames) {
        const cleanedName = name.trim().toLowerCase();
        let tag = await tx.tag.findUnique({
          where: { organizationId_name: { organizationId, name: cleanedName } },
        });
        if (!tag) {
          tag = await tx.tag.create({
            data: { organizationId, name: cleanedName },
          });
        }
        tagIds.push(tag.id);
      }

      // 2. Create service
      const service = await tx.service.create({
        data: {
          ...data,
          organizationId,
        },
      });

      // 3. Create service tag relationships
      if (tagIds.length > 0) {
        await tx.serviceTag.createMany({
          data: tagIds.map((tagId) => ({
            serviceId: service.id,
            tagId,
          })),
        });
      }

      return tx.service.findUnique({
        where: { id: service.id },
        include: {
          group: true,
          serviceTags: {
            include: { tag: true },
          },
        },
      });
    });
  }

  /**
   * Update service details inside a transaction with OCC version check
   * @param {string} id 
   * @param {string} organizationId 
   * @param {Object} data 
   * @param {string[]} [tagNames]
   * @param {string|Date} [currentUpdatedAt] Timestamp token for concurrency check
   */
  static async update(id, organizationId, data, tagNames = null, currentUpdatedAt = null) {
    return prisma.$transaction(async (tx) => {
      // Concurrency check
      if (currentUpdatedAt) {
        const existing = await tx.service.findFirst({
          where: { id, organizationId },
          select: { updatedAt: true },
        });
        if (!existing) {
          throw new Error('Service not found or inaccessible');
        }
        const dbTime = new Date(existing.updatedAt).getTime();
        const incomingTime = new Date(currentUpdatedAt).getTime();
        if (dbTime !== incomingTime) {
          throw new Error('CONCURRENCY_ERROR: Service was modified by another process. Please refresh.');
        }
      }

      // Update main service fields
      await tx.service.updateMany({
        where: { id, organizationId },
        data,
      });

      // Update tags if provided
      if (tagNames !== null) {
        // Remove existing tags mapping
        await tx.serviceTag.deleteMany({
          where: { serviceId: id },
        });

        // Add updated tags mapping
        const tagIds = [];
        for (const name of tagNames) {
          const cleanedName = name.trim().toLowerCase();
          let tag = await tx.tag.findUnique({
            where: { organizationId_name: { organizationId, name: cleanedName } },
          });
          if (!tag) {
            tag = await tx.tag.create({
              data: { organizationId, name: cleanedName },
            });
          }
          tagIds.push(tag.id);
        }

        if (tagIds.length > 0) {
          await tx.serviceTag.createMany({
            data: tagIds.map((tagId) => ({
              serviceId: id,
              tagId,
            })),
          });
        }
      }

      return tx.service.findFirst({
        where: { id, organizationId },
        include: {
          group: true,
          serviceTags: {
            include: { tag: true },
          },
        },
      });
    });
  }

  /**
   * Delete a service
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async delete(id, organizationId) {
    return prisma.service.deleteMany({
      where: { id, organizationId },
    });
  }

  /**
   * System-wide query to fetch active services (Worker exclusive)
   * This is not scoped by user organizationId as the worker scans all active services in the fleet.
   */
  static async findActiveServicesForWorker() {
    return prisma.service.findMany({
      where: { isActive: true },
      include: {
        organization: true,
      },
    });
  }

  /**
   * Worker-exclusive method to find a single service with organization details
   * @param {string} id 
   */
  static async findWorkerServiceById(id) {
    return prisma.service.findUnique({
      where: { id },
      include: { organization: true },
    });
  }

  /**
   * Worker-exclusive method to update service status and failures
   */
  static async workerUpdateStatus(id, data) {
    return prisma.service.update({
      where: { id },
      data,
    });
  }
}

export default ServiceRepository;
