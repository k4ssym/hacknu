import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827'
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: '#111827',
    marginBottom: 8
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold'
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 'medium'
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderBottomStyle: 'solid'
  },
  featureName: {
    fontSize: 12,
    color: '#374151',
    width: '40%'
  },
  featureValue: {
    fontSize: 12,
    fontWeight: 'medium',
    width: '20%',
    textAlign: 'right'
  },
  featureBarContainer: {
    width: '40%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden'
  },
  featureBar: {
    height: '100%'
  },
  logo: {
    width: 120,
    marginBottom: 20
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderTopStyle: 'solid',
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center'
  }
});

type ExplanationPDFProps = {
  applicant: {
    age?: string;
    income?: string;
    loan_amount?: string;
    credit_history?: string;
    employment_length?: string;
    debt_to_income?: string;
    score?: string;
    risk_label?: string;
  };
  shapValues: {
    feature: string;
    value: number;
  }[];
};

const ExplanationPDF = ({ applicant, shapValues }: ExplanationPDFProps) => {
  const getRiskColor = () => {
    switch (applicant.risk_label) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ZENTRO Credit Decision</Text>
          <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Applicant Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicant Summary</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Age: {applicant.age}</Text>
            <Text>Income: ${applicant.income}</Text>
            <Text>Loan Amount: ${applicant.loan_amount}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Credit History: {applicant.credit_history}</Text>
            <Text>Employment: {applicant.employment_length} years</Text>
            <Text>DTI: {applicant.debt_to_income}</Text>
          </View>
        </View>

        {/* Score Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <View style={styles.scoreContainer}>
            <View>
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Credit Score</Text>
              <Text style={styles.scoreValue}>{applicant.score}</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor() + '20', color: getRiskColor() }]}>
              <Text>{applicant.risk_label} Risk</Text>
            </View>
          </View>
        </View>

        {/* Feature Importance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Decision Factors</Text>
          {shapValues.map((item, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureName}>{item.feature}</Text>
              <Text style={[styles.featureValue, { color: item.value > 0 ? '#10B981' : '#EF4444' }]}>
                {item.value > 0 ? '+' : ''}{item.value.toFixed(3)}
              </Text>
              <View style={styles.featureBarContainer}>
                <View 
                  style={[
                    styles.featureBar, 
                    { 
                      width: `${Math.abs(item.value) * 100}%`, 
                      backgroundColor: item.value > 0 ? '#10B981' : '#EF4444' 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This report was generated automatically by ZENTRO Credit Scoring System</Text>
          <Text>Confidential - For internal use only</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ExplanationPDF;