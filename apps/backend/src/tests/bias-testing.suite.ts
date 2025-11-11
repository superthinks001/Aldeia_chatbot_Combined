/**
 * Bias Testing Suite (Sprint 4)
 *
 * Automated tests for bias detection accuracy, regression testing,
 * and demographic representation analysis.
 */

import { analyzeBias, BiasType } from '../services/bias-detection.service';

export interface BiasTestCase {
  id: string;
  name: string;
  input: string;
  expectedBiasDetected: boolean;
  expectedBiasTypes: BiasType[];
  expectedMinScore?: number;
  expectedMaxScore?: number;
  category: 'prescriptive' | 'absolute' | 'assumptive' | 'demographic' | 'economic' | 'judgmental' | 'exclusive';
}

export interface BiasTestResult {
  testId: string;
  testName: string;
  passed: boolean;
  actualDetected: boolean;
  expectedDetected: boolean;
  actualScore: number;
  actualTypes: BiasType[];
  expectedTypes: BiasType[];
  message: string;
}

export interface BiasTestSuiteReport {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  results: BiasTestResult[];
  summary: {
    byCategory: { [category: string]: { passed: number; failed: number } };
    falsePositives: number;
    falseNegatives: number;
  };
}

/**
 * Comprehensive bias test cases
 */
export const BIAS_TEST_CASES: BiasTestCase[] = [
  // Prescriptive Bias
  {
    id: 'prescriptive-1',
    name: 'Should detect prescriptive language (should)',
    input: 'You should rebuild your home immediately after the fire.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.PRESCRIPTIVE],
    expectedMinScore: 0.3,
    category: 'prescriptive'
  },
  {
    id: 'prescriptive-2',
    name: 'Should detect prescriptive language (must)',
    input: 'You must remove all debris within 30 days or face penalties.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.PRESCRIPTIVE],
    expectedMinScore: 0.3,
    category: 'prescriptive'
  },
  {
    id: 'prescriptive-3',
    name: 'Should NOT detect neutral recommendation',
    input: 'You may want to consider consulting with a contractor before rebuilding.',
    expectedBiasDetected: false,
    expectedBiasTypes: [],
    expectedMaxScore: 0.3,
    category: 'prescriptive'
  },

  // Absolute Bias
  {
    id: 'absolute-1',
    name: 'Should detect absolute statements (always)',
    input: 'Insurance companies always deny fire damage claims on the first attempt.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.ABSOLUTE],
    expectedMinScore: 0.4,
    category: 'absolute'
  },
  {
    id: 'absolute-2',
    name: 'Should detect absolute statements (never)',
    input: 'County inspectors never approve permits on the first submission.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.ABSOLUTE],
    expectedMinScore: 0.4,
    category: 'absolute'
  },
  {
    id: 'absolute-3',
    name: 'Should NOT detect qualified statement',
    input: 'Some insurance companies may require multiple submissions for fire damage claims.',
    expectedBiasDetected: false,
    expectedBiasTypes: [],
    expectedMaxScore: 0.3,
    category: 'absolute'
  },

  // Assumptive Bias
  {
    id: 'assumptive-1',
    name: 'Should detect assumptive language',
    input: 'Obviously, you would want to maximize your insurance payout.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.ASSUMPTIVE],
    expectedMinScore: 0.3,
    category: 'assumptive'
  },
  {
    id: 'assumptive-2',
    name: 'Should detect assumptive language (clearly)',
    input: 'Clearly, the best option is to opt out of the county debris removal program.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.ASSUMPTIVE],
    expectedMinScore: 0.3,
    category: 'assumptive'
  },

  // Demographic Bias
  {
    id: 'demographic-1',
    name: 'Should detect demographic assumptions',
    input: 'Elderly homeowners may struggle with the rebuilding process and should seek assistance.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.DEMOGRAPHIC, BiasType.PRESCRIPTIVE],
    expectedMinScore: 0.4,
    category: 'demographic'
  },
  {
    id: 'demographic-2',
    name: 'Should NOT detect neutral demographic reference',
    input: 'Resources are available for homeowners of all ages affected by the fire.',
    expectedBiasDetected: false,
    expectedBiasTypes: [],
    expectedMaxScore: 0.3,
    category: 'demographic'
  },

  // Economic Bias
  {
    id: 'economic-1',
    name: 'Should detect economic assumptions',
    input: 'Wealthy homeowners can easily afford private debris removal services.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.ECONOMIC, BiasType.ASSUMPTIVE],
    expectedMinScore: 0.4,
    category: 'economic'
  },
  {
    id: 'economic-2',
    name: 'Should NOT detect economic information',
    input: 'Financial assistance programs are available for homeowners affected by the fire.',
    expectedBiasDetected: false,
    expectedBiasTypes: [],
    expectedMaxScore: 0.3,
    category: 'economic'
  },

  // Judgmental Bias
  {
    id: 'judgmental-1',
    name: 'Should detect judgmental language',
    input: 'It is irresponsible to not have adequate fire insurance coverage.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.JUDGMENTAL],
    expectedMinScore: 0.5,
    category: 'judgmental'
  },
  {
    id: 'judgmental-2',
    name: 'Should detect judgmental language (foolish)',
    input: 'It would be foolish to rebuild without consulting an architect first.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.JUDGMENTAL],
    expectedMinScore: 0.5,
    category: 'judgmental'
  },

  // Exclusive Bias
  {
    id: 'exclusive-1',
    name: 'Should detect exclusive language (only)',
    input: 'Only homeowners with perfect documentation will receive full FEMA assistance.',
    expectedBiasDetected: true,
    expectedBiasTypes: [BiasType.EXCLUSIVE, BiasType.ABSOLUTE],
    expectedMinScore: 0.4,
    category: 'exclusive'
  },

  // No Bias (Control Cases)
  {
    id: 'control-1',
    name: 'Should NOT detect bias in neutral information',
    input: 'The debris removal program is available to all affected homeowners in LA County.',
    expectedBiasDetected: false,
    expectedBiasTypes: [],
    expectedMaxScore: 0.3,
    category: 'prescriptive'
  },
  {
    id: 'control-2',
    name: 'Should NOT detect bias in factual statement',
    input: 'According to LA County, the opt-out deadline for debris removal is April 30, 2025.',
    expectedBiasDetected: false,
    expectedBiasTypes: [],
    expectedMaxScore: 0.3,
    category: 'prescriptive'
  },
  {
    id: 'control-3',
    name: 'Should NOT detect bias in options presentation',
    input: 'You have two options: participate in the county debris removal program or opt out and arrange private removal.',
    expectedBiasDetected: false,
    expectedBiasTypes: [],
    expectedMaxScore: 0.3,
    category: 'prescriptive'
  }
];

/**
 * Run the bias testing suite
 */
export function runBiasTestSuite(testCases: BiasTestCase[] = BIAS_TEST_CASES): BiasTestSuiteReport {
  const results: BiasTestResult[] = [];
  const byCategory: { [category: string]: { passed: number; failed: number } } = {};

  for (const testCase of testCases) {
    const result = runBiasTest(testCase);
    results.push(result);

    // Track by category
    if (!byCategory[testCase.category]) {
      byCategory[testCase.category] = { passed: 0, failed: 0 };
    }
    if (result.passed) {
      byCategory[testCase.category].passed++;
    } else {
      byCategory[testCase.category].failed++;
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const passRate = (passed / results.length) * 100;

  // Calculate false positives and false negatives
  const falsePositives = results.filter(r => !r.passed && r.actualDetected && !r.expectedDetected).length;
  const falseNegatives = results.filter(r => !r.passed && !r.actualDetected && r.expectedDetected).length;

  return {
    totalTests: results.length,
    passed,
    failed,
    passRate: Math.round(passRate * 10) / 10,
    results,
    summary: {
      byCategory,
      falsePositives,
      falseNegatives
    }
  };
}

/**
 * Run a single bias test
 */
export function runBiasTest(testCase: BiasTestCase): BiasTestResult {
  const analysis = analyzeBias(testCase.input);

  let passed = true;
  let message = 'Test passed';

  // Check if bias was detected correctly
  if (analysis.detected !== testCase.expectedBiasDetected) {
    passed = false;
    message = `Expected bias detected: ${testCase.expectedBiasDetected}, got: ${analysis.detected}`;
  }

  // Check bias score range if specified
  if (testCase.expectedMinScore !== undefined && analysis.biasScore < testCase.expectedMinScore) {
    passed = false;
    message = `Bias score ${analysis.biasScore.toFixed(2)} below minimum ${testCase.expectedMinScore}`;
  }

  if (testCase.expectedMaxScore !== undefined && analysis.biasScore > testCase.expectedMaxScore) {
    passed = false;
    message = `Bias score ${analysis.biasScore.toFixed(2)} above maximum ${testCase.expectedMaxScore}`;
  }

  // Check if expected bias types are present
  if (testCase.expectedBiasTypes.length > 0) {
    const missingTypes = testCase.expectedBiasTypes.filter(type => !analysis.biasTypes.includes(type));
    if (missingTypes.length > 0) {
      passed = false;
      message = `Missing expected bias types: ${missingTypes.join(', ')}`;
    }
  }

  return {
    testId: testCase.id,
    testName: testCase.name,
    passed,
    actualDetected: analysis.detected,
    expectedDetected: testCase.expectedBiasDetected,
    actualScore: analysis.biasScore,
    actualTypes: analysis.biasTypes,
    expectedTypes: testCase.expectedBiasTypes,
    message
  };
}

/**
 * Generate bias testing report
 */
export function generateBiasTestReport(report: BiasTestSuiteReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('BIAS DETECTION TEST SUITE REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Total Tests: ${report.totalTests}`);
  lines.push(`Passed: ${report.passed} (${report.passRate.toFixed(1)}%)`);
  lines.push(`Failed: ${report.failed}`);
  lines.push('');

  lines.push('Summary by Category:');
  lines.push('-'.repeat(80));
  for (const [category, stats] of Object.entries(report.summary.byCategory)) {
    const total = stats.passed + stats.failed;
    const passRate = (stats.passed / total) * 100;
    lines.push(`  ${category.padEnd(20)} | Passed: ${stats.passed}/${total} (${passRate.toFixed(1)}%)`);
  }
  lines.push('');

  lines.push(`False Positives: ${report.summary.falsePositives}`);
  lines.push(`False Negatives: ${report.summary.falseNegatives}`);
  lines.push('');

  lines.push('Failed Tests:');
  lines.push('-'.repeat(80));
  const failedTests = report.results.filter(r => !r.passed);
  if (failedTests.length === 0) {
    lines.push('  None - all tests passed!');
  } else {
    for (const test of failedTests) {
      lines.push(`  [${test.testId}] ${test.testName}`);
      lines.push(`    ${test.message}`);
      lines.push(`    Actual: detected=${test.actualDetected}, score=${test.actualScore.toFixed(2)}, types=[${test.actualTypes.join(', ')}]`);
      lines.push(`    Expected: detected=${test.expectedDetected}, types=[${test.expectedTypes.join(', ')}]`);
      lines.push('');
    }
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Run regression tests (check that previously passing tests still pass)
 */
export function runRegressionTests(): BiasTestSuiteReport {
  console.log('Running bias detection regression tests...');
  const report = runBiasTestSuite();
  console.log(generateBiasTestReport(report));
  return report;
}

/**
 * Demographic representation analysis
 */
export interface DemographicAnalysisResult {
  totalTexts: number;
  demographicReferences: {
    age: number;
    gender: number;
    race: number;
    economic: number;
    disability: number;
  };
  biasedReferences: {
    age: number;
    gender: number;
    race: number;
    economic: number;
    disability: number;
  };
  recommendations: string[];
}

export function analyzeDemographicRepresentation(texts: string[]): DemographicAnalysisResult {
  const result: DemographicAnalysisResult = {
    totalTexts: texts.length,
    demographicReferences: {
      age: 0,
      gender: 0,
      race: 0,
      economic: 0,
      disability: 0
    },
    biasedReferences: {
      age: 0,
      gender: 0,
      race: 0,
      economic: 0,
      disability: 0
    },
    recommendations: []
  };

  const patterns = {
    age: /\b(elderly|senior|old|young|youth|teenager)\b/i,
    gender: /\b(male|female|man|woman|boy|girl|his|her|he|she)\b/i,
    race: /\b(white|black|asian|hispanic|latino|african|european)\b/i,
    economic: /\b(wealthy|poor|rich|low-income|high-income|affluent|disadvantaged)\b/i,
    disability: /\b(disabled|handicapped|impaired|special needs)\b/i
  };

  for (const text of texts) {
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        result.demographicReferences[category as keyof typeof result.demographicReferences]++;

        // Check if it's biased
        const analysis = analyzeBias(text);
        if (analysis.detected && analysis.biasTypes.includes(BiasType.DEMOGRAPHIC)) {
          result.biasedReferences[category as keyof typeof result.biasedReferences]++;
        }
      }
    }
  }

  // Generate recommendations
  for (const [category, count] of Object.entries(result.biasedReferences)) {
    if (count > 0) {
      const total = result.demographicReferences[category as keyof typeof result.demographicReferences];
      const biasRate = (count / total) * 100;
      result.recommendations.push(
        `${biasRate.toFixed(1)}% of ${category} references contain bias. Review and revise for neutrality.`
      );
    }
  }

  if (result.recommendations.length === 0) {
    result.recommendations.push('No significant demographic bias detected. Continue monitoring.');
  }

  return result;
}
