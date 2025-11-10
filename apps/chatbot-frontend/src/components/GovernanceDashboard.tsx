import React, { useState, useEffect } from 'react';
import './GovernanceDashboard.css';

interface DashboardData {
  overview: {
    totalMessages: number;
    totalHandoffs: number;
    biasDetectionRate: number;
    hallucinationRate: number;
    averageConfidence: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  biasMetrics: {
    totalDetected: number;
    totalCorrected: number;
    byType: { [type: string]: number };
    trend: Array<{ date: string; count: number }>;
  };
  hallucinationMetrics: {
    totalIncidents: number;
    averageRisk: number;
    byReliability: { [reliability: string]: number };
    preventedCount: number;
  };
  handoffMetrics: {
    totalHandoffs: number;
    byReason: { [reason: string]: number };
    byPriority: { [priority: string]: number };
    completionRate: number;
  };
  complianceMetrics: {
    flagsRaised: number;
    reviewsPending: number;
    reviewsCompleted: number;
    criticalIssues: number;
  };
}

const GovernanceDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await api.get(`/api/governance/dashboard?range=${dateRange}`);
      // setData(response.data);

      // Mock data for now
      setData({
        overview: {
          totalMessages: 1250,
          totalHandoffs: 23,
          biasDetectionRate: 8.5,
          hallucinationRate: 3.2,
          averageConfidence: 87.3,
          systemHealth: 'healthy'
        },
        biasMetrics: {
          totalDetected: 106,
          totalCorrected: 89,
          byType: {
            'prescriptive': 45,
            'assumptive': 28,
            'absolute': 18,
            'demographic': 15
          },
          trend: [
            { date: '2025-01-04', count: 12 },
            { date: '2025-01-05', count: 15 },
            { date: '2025-01-06', count: 18 },
            { date: '2025-01-07', count: 14 },
            { date: '2025-01-08', count: 16 },
            { date: '2025-01-09', count: 17 },
            { date: '2025-01-10', count: 14 }
          ]
        },
        hallucinationMetrics: {
          totalIncidents: 40,
          averageRisk: 18.5,
          byReliability: {
            'high': 980,
            'medium': 198,
            'low': 52,
            'unverified': 20
          },
          preventedCount: 37
        },
        handoffMetrics: {
          totalHandoffs: 23,
          byReason: {
            'low_confidence': 8,
            'user_frustration': 6,
            'explicit_request': 5,
            'bias_detected': 3,
            'emergency': 1
          },
          byPriority: {
            'urgent': 1,
            'high': 7,
            'medium': 12,
            'low': 3
          },
          completionRate: 87.0
        },
        complianceMetrics: {
          flagsRaised: 45,
          reviewsPending: 12,
          reviewsCompleted: 33,
          criticalIssues: 2
        }
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
      case 'critical': return '🚨';
      default: return '•';
    }
  };

  if (loading || !data) {
    return (
      <div className="governance-dashboard">
        <div className="dashboard-loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="governance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>AI Governance Dashboard</h1>
        <div className="date-range-selector">
          <button
            className={dateRange === '7d' ? 'active' : ''}
            onClick={() => setDateRange('7d')}
          >
            Last 7 Days
          </button>
          <button
            className={dateRange === '30d' ? 'active' : ''}
            onClick={() => setDateRange('30d')}
          >
            Last 30 Days
          </button>
          <button
            className={dateRange === '90d' ? 'active' : ''}
            onClick={() => setDateRange('90d')}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="dashboard-section">
        <h2>System Health</h2>
        <div className="health-card" style={{ borderColor: getHealthColor(data.overview.systemHealth) }}>
          <div className="health-status" style={{ color: getHealthColor(data.overview.systemHealth) }}>
            <span className="health-icon">{getHealthIcon(data.overview.systemHealth)}</span>
            <span className="health-text">{data.overview.systemHealth.toUpperCase()}</span>
          </div>
          <div className="health-metrics">
            <div className="metric">
              <div className="metric-value">{data.overview.totalMessages.toLocaleString()}</div>
              <div className="metric-label">Total Messages</div>
            </div>
            <div className="metric">
              <div className="metric-value">{data.overview.averageConfidence}%</div>
              <div className="metric-label">Avg Confidence</div>
            </div>
            <div className="metric">
              <div className="metric-value">{data.overview.biasDetectionRate}%</div>
              <div className="metric-label">Bias Rate</div>
            </div>
            <div className="metric">
              <div className="metric-value">{data.overview.hallucinationRate}%</div>
              <div className="metric-label">Hallucination Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bias Metrics */}
      <div className="dashboard-section">
        <h2>Bias Detection</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="card-header">
              <h3>Total Detected</h3>
              <span className="card-value">{data.biasMetrics.totalDetected}</span>
            </div>
            <div className="card-detail">
              Corrected: {data.biasMetrics.totalCorrected} ({((data.biasMetrics.totalCorrected / data.biasMetrics.totalDetected) * 100).toFixed(1)}%)
            </div>
          </div>

          <div className="metric-card">
            <h3>By Type</h3>
            <div className="type-breakdown">
              {Object.entries(data.biasMetrics.byType).map(([type, count]) => (
                <div key={type} className="type-item">
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hallucination Metrics */}
      <div className="dashboard-section">
        <h2>Hallucination Prevention</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="card-header">
              <h3>Total Incidents</h3>
              <span className="card-value">{data.hallucinationMetrics.totalIncidents}</span>
            </div>
            <div className="card-detail">
              Prevented: {data.hallucinationMetrics.preventedCount} ({((data.hallucinationMetrics.preventedCount / data.hallucinationMetrics.totalIncidents) * 100).toFixed(1)}%)
            </div>
            <div className="card-detail">
              Average Risk: {data.hallucinationMetrics.averageRisk}%
            </div>
          </div>

          <div className="metric-card">
            <h3>Reliability Distribution</h3>
            <div className="type-breakdown">
              {Object.entries(data.hallucinationMetrics.byReliability).map(([reliability, count]) => (
                <div key={reliability} className="type-item">
                  <span className="type-name">{reliability}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Human Handoff Metrics */}
      <div className="dashboard-section">
        <h2>Human Handoff</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="card-header">
              <h3>Total Handoffs</h3>
              <span className="card-value">{data.handoffMetrics.totalHandoffs}</span>
            </div>
            <div className="card-detail">
              Completion Rate: {data.handoffMetrics.completionRate}%
            </div>
          </div>

          <div className="metric-card">
            <h3>By Reason</h3>
            <div className="type-breakdown">
              {Object.entries(data.handoffMetrics.byReason).map(([reason, count]) => (
                <div key={reason} className="type-item">
                  <span className="type-name">{reason.replace(/_/g, ' ')}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-card">
            <h3>By Priority</h3>
            <div className="type-breakdown">
              {Object.entries(data.handoffMetrics.byPriority).map(([priority, count]) => (
                <div key={priority} className="type-item">
                  <span className="type-name">{priority}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="dashboard-section">
        <h2>Compliance & Review</h2>
        <div className="compliance-grid">
          <div className="compliance-card">
            <div className="compliance-value">{data.complianceMetrics.flagsRaised}</div>
            <div className="compliance-label">Flags Raised</div>
          </div>
          <div className="compliance-card warning">
            <div className="compliance-value">{data.complianceMetrics.reviewsPending}</div>
            <div className="compliance-label">Reviews Pending</div>
          </div>
          <div className="compliance-card">
            <div className="compliance-value">{data.complianceMetrics.reviewsCompleted}</div>
            <div className="compliance-label">Reviews Completed</div>
          </div>
          <div className="compliance-card critical">
            <div className="compliance-value">{data.complianceMetrics.criticalIssues}</div>
            <div className="compliance-label">Critical Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceDashboard;
