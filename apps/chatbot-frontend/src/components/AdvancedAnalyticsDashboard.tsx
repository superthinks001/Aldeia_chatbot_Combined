/**
 * Advanced Analytics Dashboard
 *
 * Comprehensive analytics interface for business intelligence:
 * - User analytics with demographic breakdown
 * - Conversation quality metrics
 * - Performance monitoring
 * - Ethical AI metrics
 * - Predictive analytics with trend forecasting
 * - Document monitoring status
 *
 * Sprint 5: Advanced Features & Analytics
 */

import React, { useState, useEffect } from 'react';
import './AdvancedAnalyticsDashboard.css';

// ============================================================================
// Types
// ============================================================================

interface AnalyticsData {
  overview: {
    systemHealth: 'healthy' | 'warning' | 'critical';
    overallScore: number;
    lastUpdated: Date;
  };
  userAnalytics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    averageSessionDuration: number;
    averageMessagesPerSession: number;
    userRetentionRate: number;
    userChurnRate: number;
    byDemographics: {
      ageGroup: { [key: string]: number };
      location: { [key: string]: number };
      deviceType: { [key: string]: number };
      incomeLevel: { [key: string]: number };
    };
  };
  conversationQuality: {
    totalConversations: number;
    averageConfidence: number;
    averageSatisfaction: number;
    completionRate: number;
    abandonmentRate: number;
    averageTurns: number;
    resolvedQueries: number;
    unresolvedQueries: number;
    qualityScore: number;
    byIntent: {
      [intent: string]: {
        count: number;
        avgConfidence: number;
        successRate: number;
      };
    };
  };
  performance: {
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    systemUptime: number;
    errorRate: number;
    cacheHitRate: number;
    throughput: number;
    peakLoad: number;
    resourceUtilization: {
      cpu: number;
      memory: number;
      storage: number;
    };
  };
  ethicalAI: {
    biasMetrics: {
      detectionRate: number;
      correctionRate: number;
      byDemographic: any;
      byType: { [key: string]: number };
    };
    hallucinationMetrics: {
      incidentRate: number;
      avgRiskScore: number;
      byCategory: { [key: string]: number };
      preventionRate: number;
    };
    handoffMetrics: {
      totalHandoffs: number;
      handoffRate: number;
      byReason: { [key: string]: number };
      byDemographic: { [key: string]: number };
      avgResolutionTime: number;
    };
    fairnessScore: number;
  };
  predictive: {
    trends: {
      userGrowth: TrendForecast;
      biasIncidents: TrendForecast;
      hallucinationRisk: TrendForecast;
      handoffRate: TrendForecast;
      systemLoad: TrendForecast;
    };
    anomalies: Anomaly[];
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high' | 'critical';
      riskFactors: RiskFactor[];
    };
    recommendations: string[];
  };
}

interface TrendForecast {
  current: number;
  predicted7d: number;
  predicted30d: number;
  predicted90d: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  historicalData: { date: string; value: number }[];
}

interface Anomaly {
  id: string;
  timestamp: Date;
  type: 'spike' | 'drop' | 'pattern_change';
  metric: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
}

interface RiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: number;
  impact: number;
  description: string;
  mitigation: string;
}

// ============================================================================
// Component
// ============================================================================

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'quality' | 'performance' | 'ethical' | 'predictive'>('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // In production, would call actual API
      // const response = await fetch(`/api/analytics/advanced?range=${dateRange}`);
      // const result = await response.json();

      // Simulated data for demonstration
      const mockData: AnalyticsData = generateMockData();
      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'healthy': return '#2e7d32';
      case 'warning': return '#f57c00';
      case 'critical': return '#c62828';
      default: return '#757575';
    }
  };

  const getHealthIcon = (health: string): string => {
    switch (health) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '✖';
      default: return '?';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      case 'stable': return '→';
      default: return '—';
    }
  };

  const getTrendColor = (trend: string, goodWhenIncreasing: boolean = true): string => {
    if (trend === 'stable') return '#757575';
    const isGood = goodWhenIncreasing
      ? trend === 'increasing'
      : trend === 'decreasing';
    return isGood ? '#2e7d32' : '#c62828';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading || !data) {
    return (
      <div className="advanced-analytics-dashboard loading">
        <div className="spinner"></div>
        <p>Loading advanced analytics...</p>
      </div>
    );
  }

  return (
    <div className="advanced-analytics-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📊 Advanced Analytics Dashboard</h1>
        <div className="header-controls">
          <div className="date-range-selector">
            <button
              className={dateRange === '7d' ? 'active' : ''}
              onClick={() => setDateRange('7d')}
            >
              7 Days
            </button>
            <button
              className={dateRange === '30d' ? 'active' : ''}
              onClick={() => setDateRange('30d')}
            >
              30 Days
            </button>
            <button
              className={dateRange === '90d' ? 'active' : ''}
              onClick={() => setDateRange('90d')}
            >
              90 Days
            </button>
          </div>
          <button className="refresh-btn" onClick={loadAnalyticsData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="system-overview">
        <div
          className="health-indicator"
          style={{ backgroundColor: getHealthColor(data.overview.systemHealth) }}
        >
          <span className="health-icon">{getHealthIcon(data.overview.systemHealth)}</span>
          <span className="health-status">{data.overview.systemHealth.toUpperCase()}</span>
        </div>
        <div className="overall-score">
          <div className="score-label">Overall Score</div>
          <div className="score-value">{data.overview.overallScore}/100</div>
        </div>
        <div className="last-updated">
          Last updated: {new Date(data.overview.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={activeTab === 'quality' ? 'active' : ''}
          onClick={() => setActiveTab('quality')}
        >
          Conversation Quality
        </button>
        <button
          className={activeTab === 'performance' ? 'active' : ''}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={activeTab === 'ethical' ? 'active' : ''}
          onClick={() => setActiveTab('ethical')}
        >
          Ethical AI
        </button>
        <button
          className={activeTab === 'predictive' ? 'active' : ''}
          onClick={() => setActiveTab('predictive')}
        >
          Predictive
        </button>
      </div>

      {/* Tab Content */}
      <div className="analytics-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="metric-card">
              <h3>👥 User Metrics</h3>
              <div className="metric-row">
                <span>Total Users</span>
                <span className="metric-value">{data.userAnalytics.totalUsers.toLocaleString()}</span>
              </div>
              <div className="metric-row">
                <span>Active Users</span>
                <span className="metric-value">{data.userAnalytics.activeUsers.toLocaleString()}</span>
              </div>
              <div className="metric-row">
                <span>Retention Rate</span>
                <span className="metric-value">{data.userAnalytics.userRetentionRate}%</span>
              </div>
            </div>

            <div className="metric-card">
              <h3>💬 Conversation Quality</h3>
              <div className="metric-row">
                <span>Quality Score</span>
                <span className="metric-value">{data.conversationQuality.qualityScore}/100</span>
              </div>
              <div className="metric-row">
                <span>Avg Confidence</span>
                <span className="metric-value">{data.conversationQuality.averageConfidence}%</span>
              </div>
              <div className="metric-row">
                <span>Completion Rate</span>
                <span className="metric-value">{data.conversationQuality.completionRate}%</span>
              </div>
            </div>

            <div className="metric-card">
              <h3>⚡ Performance</h3>
              <div className="metric-row">
                <span>Avg Response Time</span>
                <span className="metric-value">{data.performance.averageResponseTime}ms</span>
              </div>
              <div className="metric-row">
                <span>System Uptime</span>
                <span className="metric-value">{data.performance.systemUptime}%</span>
              </div>
              <div className="metric-row">
                <span>Cache Hit Rate</span>
                <span className="metric-value">{data.performance.cacheHitRate}%</span>
              </div>
            </div>

            <div className="metric-card">
              <h3>⚖️ Ethical AI</h3>
              <div className="metric-row">
                <span>Fairness Score</span>
                <span className="metric-value">{data.ethicalAI.fairnessScore}/100</span>
              </div>
              <div className="metric-row">
                <span>Bias Detection</span>
                <span className="metric-value">{data.ethicalAI.biasMetrics.detectionRate}%</span>
              </div>
              <div className="metric-row">
                <span>Hallucination Prevention</span>
                <span className="metric-value">{data.ethicalAI.hallucinationMetrics.preventionRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-analytics">
            <div className="analytics-section">
              <h3>User Engagement</h3>
              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-label">Total Users</div>
                  <div className="metric-value large">{data.userAnalytics.totalUsers.toLocaleString()}</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Active Users</div>
                  <div className="metric-value large">{data.userAnalytics.activeUsers.toLocaleString()}</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">New Users</div>
                  <div className="metric-value large">{data.userAnalytics.newUsers.toLocaleString()}</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Returning Users</div>
                  <div className="metric-value large">{data.userAnalytics.returningUsers.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Session Metrics</h3>
              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-label">Avg Session Duration</div>
                  <div className="metric-value">{formatDuration(data.userAnalytics.averageSessionDuration)}</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Avg Messages/Session</div>
                  <div className="metric-value">{data.userAnalytics.averageMessagesPerSession}</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Retention Rate</div>
                  <div className="metric-value">{data.userAnalytics.userRetentionRate}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Churn Rate</div>
                  <div className="metric-value">{data.userAnalytics.userChurnRate}%</div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Demographics</h3>
              <div className="demographic-breakdown">
                <div className="demographic-category">
                  <h4>Age Groups</h4>
                  {Object.entries(data.userAnalytics.byDemographics.ageGroup).map(([age, count]) => (
                    <div key={age} className="demographic-row">
                      <span>{age}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(count / data.userAnalytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>

                <div className="demographic-category">
                  <h4>Locations</h4>
                  {Object.entries(data.userAnalytics.byDemographics.location).map(([loc, count]) => (
                    <div key={loc} className="demographic-row">
                      <span>{loc}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(count / data.userAnalytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>

                <div className="demographic-category">
                  <h4>Device Types</h4>
                  {Object.entries(data.userAnalytics.byDemographics.deviceType).map(([device, count]) => (
                    <div key={device} className="demographic-row">
                      <span>{device}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(count / data.userAnalytics.totalUsers) * 100}%` }}
                        ></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Quality Tab */}
        {activeTab === 'quality' && (
          <div className="quality-analytics">
            <div className="analytics-section">
              <h3>Overall Quality</h3>
              <div className="quality-score-display">
                <div className="score-circle" style={{
                  background: `conic-gradient(#2e7d32 ${data.conversationQuality.qualityScore * 3.6}deg, #e0e0e0 0deg)`
                }}>
                  <div className="score-inner">
                    <div className="score-number">{data.conversationQuality.qualityScore}</div>
                    <div className="score-label">Quality Score</div>
                  </div>
                </div>
                <div className="quality-metrics">
                  <div className="quality-metric">
                    <span>Avg Confidence</span>
                    <strong>{data.conversationQuality.averageConfidence}%</strong>
                  </div>
                  <div className="quality-metric">
                    <span>Avg Satisfaction</span>
                    <strong>{data.conversationQuality.averageSatisfaction}%</strong>
                  </div>
                  <div className="quality-metric">
                    <span>Completion Rate</span>
                    <strong>{data.conversationQuality.completionRate}%</strong>
                  </div>
                  <div className="quality-metric">
                    <span>Avg Turns</span>
                    <strong>{data.conversationQuality.averageTurns}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Query Resolution</h3>
              <div className="resolution-stats">
                <div className="stat-item resolved">
                  <div className="stat-value">{data.conversationQuality.resolvedQueries}</div>
                  <div className="stat-label">Resolved</div>
                </div>
                <div className="stat-item unresolved">
                  <div className="stat-value">{data.conversationQuality.unresolvedQueries}</div>
                  <div className="stat-label">Unresolved</div>
                </div>
                <div className="stat-item abandoned">
                  <div className="stat-value">{data.conversationQuality.abandonmentRate}%</div>
                  <div className="stat-label">Abandonment Rate</div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Performance by Intent</h3>
              <div className="intent-table">
                <table>
                  <thead>
                    <tr>
                      <th>Intent</th>
                      <th>Count</th>
                      <th>Avg Confidence</th>
                      <th>Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.conversationQuality.byIntent).map(([intent, stats]) => (
                      <tr key={intent}>
                        <td>{intent.replace(/_/g, ' ')}</td>
                        <td>{stats.count}</td>
                        <td>{stats.avgConfidence.toFixed(1)}%</td>
                        <td>{stats.successRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="performance-analytics">
            <div className="analytics-section">
              <h3>Response Time</h3>
              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-label">Average</div>
                  <div className="metric-value">{data.performance.averageResponseTime}ms</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">P50 (Median)</div>
                  <div className="metric-value">{data.performance.p50ResponseTime}ms</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">P95</div>
                  <div className="metric-value">{data.performance.p95ResponseTime}ms</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">P99</div>
                  <div className="metric-value">{data.performance.p99ResponseTime}ms</div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>System Health</h3>
              <div className="metric-grid">
                <div className="metric-item">
                  <div className="metric-label">Uptime</div>
                  <div className="metric-value">{data.performance.systemUptime}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Error Rate</div>
                  <div className="metric-value">{data.performance.errorRate}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Cache Hit Rate</div>
                  <div className="metric-value">{data.performance.cacheHitRate}%</div>
                </div>
                <div className="metric-item">
                  <div className="metric-label">Throughput</div>
                  <div className="metric-value">{data.performance.throughput} req/min</div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Resource Utilization</h3>
              <div className="resource-bars">
                <div className="resource-item">
                  <div className="resource-label">CPU</div>
                  <div className="resource-bar">
                    <div
                      className="resource-fill"
                      style={{
                        width: `${data.performance.resourceUtilization.cpu}%`,
                        backgroundColor: data.performance.resourceUtilization.cpu > 80 ? '#c62828' : '#2e7d32'
                      }}
                    ></div>
                  </div>
                  <div className="resource-value">{data.performance.resourceUtilization.cpu}%</div>
                </div>
                <div className="resource-item">
                  <div className="resource-label">Memory</div>
                  <div className="resource-bar">
                    <div
                      className="resource-fill"
                      style={{
                        width: `${data.performance.resourceUtilization.memory}%`,
                        backgroundColor: data.performance.resourceUtilization.memory > 80 ? '#c62828' : '#2e7d32'
                      }}
                    ></div>
                  </div>
                  <div className="resource-value">{data.performance.resourceUtilization.memory}%</div>
                </div>
                <div className="resource-item">
                  <div className="resource-label">Storage</div>
                  <div className="resource-bar">
                    <div
                      className="resource-fill"
                      style={{
                        width: `${data.performance.resourceUtilization.storage}%`,
                        backgroundColor: data.performance.resourceUtilization.storage > 80 ? '#c62828' : '#2e7d32'
                      }}
                    ></div>
                  </div>
                  <div className="resource-value">{data.performance.resourceUtilization.storage}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ethical AI Tab */}
        {activeTab === 'ethical' && (
          <div className="ethical-analytics">
            <div className="analytics-section">
              <h3>Fairness Score</h3>
              <div className="fairness-display">
                <div className="fairness-score">
                  <div className="score-value large">{data.ethicalAI.fairnessScore}</div>
                  <div className="score-label">Fairness Score</div>
                  <div className="score-description">Measures equity across demographics</div>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Bias Metrics</h3>
              <div className="bias-stats">
                <div className="stat-row">
                  <span>Detection Rate</span>
                  <strong>{data.ethicalAI.biasMetrics.detectionRate}%</strong>
                </div>
                <div className="stat-row">
                  <span>Correction Rate</span>
                  <strong>{data.ethicalAI.biasMetrics.correctionRate}%</strong>
                </div>
              </div>
              <div className="bias-types">
                <h4>By Type</h4>
                {Object.entries(data.ethicalAI.biasMetrics.byType).map(([type, count]) => (
                  <div key={type} className="type-row">
                    <span>{type.replace(/_/g, ' ')}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-section">
              <h3>Hallucination Metrics</h3>
              <div className="hallucination-stats">
                <div className="stat-row">
                  <span>Incident Rate</span>
                  <strong>{data.ethicalAI.hallucinationMetrics.incidentRate}%</strong>
                </div>
                <div className="stat-row">
                  <span>Prevention Rate</span>
                  <strong>{data.ethicalAI.hallucinationMetrics.preventionRate}%</strong>
                </div>
                <div className="stat-row">
                  <span>Avg Risk Score</span>
                  <strong>{data.ethicalAI.hallucinationMetrics.avgRiskScore}</strong>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Human Handoff</h3>
              <div className="handoff-stats">
                <div className="stat-item">
                  <div className="stat-value">{data.ethicalAI.handoffMetrics.totalHandoffs}</div>
                  <div className="stat-label">Total Handoffs</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{data.ethicalAI.handoffMetrics.handoffRate}%</div>
                  <div className="stat-label">Handoff Rate</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{data.ethicalAI.handoffMetrics.avgResolutionTime}m</div>
                  <div className="stat-label">Avg Resolution Time</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictive Tab */}
        {activeTab === 'predictive' && (
          <div className="predictive-analytics">
            <div className="analytics-section">
              <h3>Trend Forecasts</h3>
              <div className="trends-grid">
                {Object.entries(data.predictive.trends).map(([key, trend]) => (
                  <div key={key} className="trend-card">
                    <div className="trend-header">
                      <h4>{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <span
                        className="trend-indicator"
                        style={{ color: getTrendColor(trend.trend, !key.includes('bias') && !key.includes('hallucination')) }}
                      >
                        {getTrendIcon(trend.trend)} {trend.trend}
                      </span>
                    </div>
                    <div className="trend-values">
                      <div className="value-item">
                        <span>Current</span>
                        <strong>{trend.current}</strong>
                      </div>
                      <div className="value-item">
                        <span>7-day</span>
                        <strong>{trend.predicted7d}</strong>
                      </div>
                      <div className="value-item">
                        <span>30-day</span>
                        <strong>{trend.predicted30d}</strong>
                      </div>
                      <div className="value-item">
                        <span>90-day</span>
                        <strong>{trend.predicted90d}</strong>
                      </div>
                    </div>
                    <div className="trend-confidence">
                      Confidence: {(trend.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-section">
              <h3>Risk Assessment</h3>
              <div
                className="risk-level"
                style={{ backgroundColor: getHealthColor(data.predictive.riskAssessment.overallRisk) }}
              >
                Overall Risk: {data.predictive.riskAssessment.overallRisk.toUpperCase()}
              </div>
              <div className="risk-factors">
                {data.predictive.riskAssessment.riskFactors.map((factor, i) => (
                  <div key={i} className={`risk-factor ${factor.severity}`}>
                    <div className="factor-header">
                      <strong>{factor.factor}</strong>
                      <span className="severity-badge">{factor.severity}</span>
                    </div>
                    <div className="factor-description">{factor.description}</div>
                    <div className="factor-metrics">
                      <span>Likelihood: {(factor.likelihood * 100).toFixed(0)}%</span>
                      <span>Impact: {(factor.impact * 100).toFixed(0)}%</span>
                    </div>
                    <div className="factor-mitigation">
                      <strong>Mitigation:</strong> {factor.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {data.predictive.anomalies.length > 0 && (
              <div className="analytics-section">
                <h3>Anomalies Detected</h3>
                <div className="anomalies-list">
                  {data.predictive.anomalies.map((anomaly) => (
                    <div key={anomaly.id} className={`anomaly ${anomaly.severity}`}>
                      <div className="anomaly-header">
                        <span className="anomaly-type">{anomaly.type.toUpperCase()}</span>
                        <span className="anomaly-metric">{anomaly.metric}</span>
                        <span className="anomaly-time">
                          {new Date(anomaly.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="anomaly-description">{anomaly.description}</div>
                      <div className="anomaly-values">
                        <span>Expected: {anomaly.expectedValue}</span>
                        <span>Actual: {anomaly.actualValue}</span>
                        <span>Deviation: {anomaly.deviation.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="analytics-section">
              <h3>Recommendations</h3>
              <div className="recommendations-list">
                {data.predictive.recommendations.map((rec, i) => (
                  <div key={i} className="recommendation">
                    <span className="rec-number">{i + 1}</span>
                    <span className="rec-text">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Mock Data Generator
// ============================================================================

function generateMockData(): AnalyticsData {
  return {
    overview: {
      systemHealth: 'healthy',
      overallScore: 87,
      lastUpdated: new Date()
    },
    userAnalytics: {
      totalUsers: 1247,
      activeUsers: 856,
      newUsers: 142,
      returningUsers: 714,
      averageSessionDuration: 450,
      averageMessagesPerSession: 8.5,
      userRetentionRate: 68.5,
      userChurnRate: 31.5,
      byDemographics: {
        ageGroup: { '18-24': 150, '25-34': 349, '35-44': 312, '45-54': 225, '55-64': 150, '65+': 61 },
        location: { 'Los Angeles': 437, 'Malibu': 312, 'Pacific Palisades': 187, 'Santa Monica': 187, 'Other': 124 },
        deviceType: { 'mobile': 811, 'desktop': 374, 'tablet': 62 },
        incomeLevel: { 'low': 312, 'medium': 561, 'high': 374 }
      }
    },
    conversationQuality: {
      totalConversations: 3542,
      averageConfidence: 82.5,
      averageSatisfaction: 78.3,
      completionRate: 82.1,
      abandonmentRate: 17.9,
      averageTurns: 6.5,
      resolvedQueries: 2907,
      unresolvedQueries: 635,
      qualityScore: 81,
      byIntent: {
        'emergency': { count: 245, avgConfidence: 95.2, successRate: 98.5 },
        'status': { count: 892, avgConfidence: 88.5, successRate: 92.3 },
        'process': { count: 678, avgConfidence: 85.1, successRate: 89.7 },
        'financial': { count: 534, avgConfidence: 79.8, successRate: 84.2 },
        'legal': { count: 423, avgConfidence: 72.5, successRate: 78.9 }
      }
    },
    performance: {
      averageResponseTime: 450,
      p50ResponseTime: 380,
      p95ResponseTime: 850,
      p99ResponseTime: 1200,
      systemUptime: 99.7,
      errorRate: 0.3,
      cacheHitRate: 78,
      throughput: 45,
      peakLoad: 120,
      resourceUtilization: { cpu: 42, memory: 68, storage: 55 }
    },
    ethicalAI: {
      biasMetrics: {
        detectionRate: 3.8,
        correctionRate: 95.2,
        byDemographic: {},
        byType: { 'prescriptive': 45, 'assumptive': 38, 'absolute': 28, 'demographic': 12 }
      },
      hallucinationMetrics: {
        incidentRate: 1.2,
        avgRiskScore: 0.18,
        byCategory: { 'factual': 15, 'procedural': 8, 'temporal': 5 },
        preventionRate: 98.8
      },
      handoffMetrics: {
        totalHandoffs: 142,
        handoffRate: 4.0,
        byReason: { 'low_confidence': 52, 'bias_detected': 28, 'user_frustration': 35, 'explicit_request': 27 },
        byDemographic: {},
        avgResolutionTime: 18
      },
      fairnessScore: 89
    },
    predictive: {
      trends: {
        userGrowth: { current: 95, predicted7d: 100, predicted30d: 109, predicted90d: 124, trend: 'increasing', confidence: 0.82, historicalData: [] },
        biasIncidents: { current: 12, predicted7d: 11, predicted30d: 10, predicted90d: 8, trend: 'decreasing', confidence: 0.78, historicalData: [] },
        hallucinationRisk: { current: 5, predicted7d: 5, predicted30d: 4, predicted90d: 4, trend: 'decreasing', confidence: 0.85, historicalData: [] },
        handoffRate: { current: 12, predicted7d: 12, predicted30d: 11, predicted90d: 11, trend: 'stable', confidence: 0.75, historicalData: [] },
        systemLoad: { current: 62, predicted7d: 65, predicted30d: 71, predicted90d: 81, trend: 'increasing', confidence: 0.88, historicalData: [] }
      },
      anomalies: [],
      riskAssessment: {
        overallRisk: 'medium',
        riskFactors: [
          {
            factor: 'System Load Growth',
            severity: 'medium',
            likelihood: 0.6,
            impact: 0.6,
            description: 'Growing user base may strain current infrastructure',
            mitigation: 'Plan for horizontal scaling and implement caching strategies'
          }
        ]
      },
      recommendations: [
        'User growth is strong. Consider scaling infrastructure proactively to handle increased load.',
        'Bias incidents are decreasing. Current bias mitigation strategies are effective.',
        'System is performing well. Continue monitoring key metrics and maintaining current practices.'
      ]
    }
  };
}

export default AdvancedAnalyticsDashboard;
