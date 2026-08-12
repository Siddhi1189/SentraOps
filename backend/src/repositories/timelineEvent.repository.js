import prisma from '../config/db.js';

class TimelineEventRepository {
  /**
   * Append a new timeline event (immutable)
   * @param {Object} data 
   */
  static async create(data) {
    return prisma.timelineEvent.create({
      data: {
        incidentId: data.incidentId,
        eventType: data.eventType,
        description: data.description,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Fetch chronological timeline events for an incident, validating tenant ownership
   * @param {string} incidentId 
   * @param {string} organizationId 
   */
  static async findManyByIncident(incidentId, organizationId) {
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, organizationId },
      select: { id: true },
    });

    if (!incident) {
      return [];
    }

    return prisma.timelineEvent.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export default TimelineEventRepository;
