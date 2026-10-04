import AppError from '../utils/AppError.js';
import IncidentRepository from '../repositories/incident.repository.js';
import HealthCheckRepository from '../repositories/healthCheck.repository.js';
import prisma from '../config/db.js';

export class AiSummaryService {
  /**
   * Build prompt text and call Anthropic API to generate incident summary.
   * Caches result in Incident.aiSummary.
   *
   * @param {string} organizationId
   * @param {string} incidentId
   * @returns {Promise<string>}
   */
  static async generateIncidentSummary(organizationId, incidentId) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AppError(
        'AI summary service is unavailable: ANTHROPIC_API_KEY is not configured',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    const incident = await IncidentRepository.findById(incidentId, organizationId);
    if (!incident) {
      throw new AppError('Incident not found', 404, 'NOT_FOUND');
    }

    // Fetch last 20 health checks for the associated service
    let healthChecks = [];
    if (incident.serviceId) {
      const hcResult = await HealthCheckRepository.findManyByService(incident.serviceId, organizationId, {
        limit: 20,
      });
      healthChecks = hcResult.healthChecks || [];
    }

    // Build raw input context
    const incidentContext = {
      id: incident.id,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      rootCause: incident.rootCause,
      resolutionNotes: incident.resolutionNotes,
      detectedAt: incident.detectedAt,
      resolvedAt: incident.resolvedAt,
      service: incident.service
        ? {
            name: incident.service.name,
            url: incident.service.url,
            currentStatus: incident.service.currentStatus,
          }
        : null,
      timelineEvents: (incident.timelineEvents || []).map((te) => ({
        type: te.eventType,
        description: te.description,
        createdAt: te.createdAt,
      })),
      recentHealthChecks: healthChecks.map((hc) => ({
        status: hc.status,
        code: hc.httpStatusCode,
        latencyMs: hc.responseTimeMs,
        error: hc.errorMessage,
        checkedAt: hc.checkedAt,
      })),
    };

    let rawInput = `You are a site reliability engineering AI assistant. Summarize this incident with concise root-cause insights and remediation timeline:\n${JSON.stringify(
      incidentContext,
      null,
      2
    )}`;

    // Truncate input to 6000 characters
    if (rawInput.length > 6000) {
      rawInput = rawInput.slice(0, 6000);
    }

    // NOTE: Rule forbids logging prompts. Never log rawInput!
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: rawInput,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(`Anthropic API error (${response.status}): ${errText}`, 502, 'BAD_GATEWAY');
    }

    const data = await response.json();
    const summaryText = data?.content?.[0]?.text || 'No summary generated.';

    // Cache result in Incident.aiSummary
    await prisma.incident.update({
      where: { id: incident.id },
      data: { aiSummary: summaryText },
    });

    return summaryText;
  }
}

export default AiSummaryService;
