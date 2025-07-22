/* eslint-disable jsx-a11y/alt-text */
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice } from '../../../lib/types';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 32,
    fontSize: 12,
    lineHeight: 1.5,
    fontFamily: 'Helvetica',
  },
  container: {
    maxWidth: '100%',
    borderRadius: 12,
    padding: 16,
    '@media min-width: 640px': {
      padding: 32,
    },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  companyInfo: {
    width: '50%',
  },
  invoiceInfo: {
    width: '40%',
    alignItems: 'flex-end',
  },
  logo: {
    width:"64",
    height:"64", // Reduced from 64 to make it smaller
    marginBottom: 16,
   
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'semibold',
    marginBottom: 4,
    '@media min-width: 640px': {
      fontSize: 20,
    },
  },
  companyText: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 2,
    '@media min-width: 640px': {
      fontSize: 14,
    },
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    '@media min-width: 640px': {
      fontSize: 24,
    },
  },
  invoiceNumber: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 8,
    '@media min-width: 640px': {
      fontSize: 14,
    },
  },
  invoiceDate: {
    color: '#6B7280',
    fontSize: 10,
    marginBottom: 2,
    '@media min-width: 640px': {
      fontSize: 12,
    },
  },
  clientInfo: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  clientDetails: {
    width: '50%',
  },
  billToTitle: {
    fontSize: 14,
    fontWeight: 'semibold',
    color: '#111827',
    marginBottom: 8,
    '@media min-width: 640px': {
      fontSize: 16,
    },
  },
  clientName: {
    fontWeight: 'medium',
    marginBottom: 4,
  },
  clientText: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 2,
    '@media min-width: 640px': {
      fontSize: 14,
    },
  },
  table: {
    width: '100%',
    marginBottom: 32,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  tableHeaderText: {
    color: '#374151',
    fontWeight: 'semibold',
    fontSize: 10,
    '@media min-width: 640px': {
      fontSize: 12,
    },
  },
  tableCell: {
    paddingHorizontal: 4,
  },
  descCol: {
    width: '50%',
    textAlign: 'left',
  },
  qtyCol: {
    width: '15%',
    textAlign: 'center',
  },
  rateCol: {
    width: '20%',
    textAlign: 'right',
    

  },
  amountCol: {
    width: '20%',
    textAlign: 'right',
  },
  tableText: {
    fontSize: 10,
    color: '#6B7280',
    '@media min-width: 640px': {
      fontSize: 12,
    },
  },
  amountText: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'medium',
    '@media min-width: 640px': {
      fontSize: 12,
    },
  },
  totals: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: '#111827',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    color: '#6B7280',
    fontSize: 12,
    '@media min-width: 640px': {
      fontSize: 14,
    },
  },
  totalValue: {
    color: '#111827',
    fontSize: 12,
    '@media min-width: 640px': {
      fontSize: 14,
    },
  },
  grandTotalLabel: {
    fontWeight: 'semibold',
    fontSize: 14,
    '@media min-width: 640px': {
      fontSize: 16,
    },
  },
  grandTotalValue: {
    fontWeight: 'bold',
    fontSize: 14,
    '@media min-width: 640px': {
      fontSize: 16,
    },
  },
  notes: {
    marginBottom: 32,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'semibold',
    color: '#111827',
    marginBottom: 8,
    '@media min-width: 640px': {
      fontSize: 16,
    },
  },
  notesText: {
    color: '#6B7280',
    fontSize: 12,
    '@media min-width: 640px': {
      fontSize: 14,
    },
  },
  footer: {
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 10,
    '@media min-width: 640px': {
      fontSize: 12,
    },
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
}

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => {
  const currencySymbol = getCurrencySymbol(invoice.currency);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {/* Company Info */}
            <View style={styles.companyInfo}>
              {invoice.company.logo && (
                <Image src={invoice.company.logo} style={styles.logo} />
              )}
              <Text style={styles.companyName}>{invoice.company.name || 'Your Company'}</Text>
              {invoice.company.email && (
                <Text style={styles.companyText}>{invoice.company.email}</Text>
              )}
              {invoice.company.address && (
                <Text style={styles.companyText}>{invoice.company.address}</Text>
              )}
            </View>

            {/* Invoice Info */}
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>#{invoice.invoice_number || 'INV-0001'}</Text>
              <View style={{ marginTop: 8 }}>
                <Text style={styles.invoiceDate}>
                  <Text>Invoice Date: </Text>
                  <Text>{invoice.date || 'Not set'}</Text>
                </Text>
                <Text style={styles.invoiceDate}>
                  <Text>Due Date: </Text>
                  <Text>{invoice.due_date || 'Not set'}</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Client Info */}
          <View style={styles.clientInfo}>
            <View style={styles.clientDetails}>
              <Text style={styles.billToTitle}>Bill To:</Text>
              <Text style={[styles.clientText, styles.clientName]}>
                {invoice.client.name || 'Client Name'}
              </Text>
              {invoice.client.email && (
                <Text style={styles.clientText}>{invoice.client.email}</Text>
              )}
              {invoice.client.address && (
                <Text style={styles.clientText}>{invoice.client.address}</Text>
              )}
               {invoice.client.phone && ( // Add phone number display
                <Text style={styles.clientText}>{invoice.client.phone}</Text>
              )}

              {invoice.client.vat && (
                <Text style={styles.clientText}>VAT: {invoice.client.vat}</Text>
              )}
            </View>
          </View>

          {/* Items Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.descCol]}>
                <Text style={styles.tableHeaderText}>Description</Text>
              </View>
              <View style={[styles.tableCell, styles.qtyCol]}>
                <Text style={styles.tableHeaderText}>Qty</Text>
              </View>
              <View style={[styles.tableCell, styles.rateCol]}>
                <Text style={styles.tableHeaderText}>Rate</Text>
              </View>
              <View style={[styles.tableCell, styles.amountCol]}>
                <Text style={styles.tableHeaderText}>Amount</Text>
              </View>
            </View>

            {/* Table Rows */}
            {invoice.items?.length > 0 ? (
              invoice.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.descCol]}>
                    <Text style={styles.tableText}>{item.description || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.qtyCol]}>
                    <Text style={styles.tableText}>{item.quantity}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.rateCol]}>
                    <Text style={styles.tableText}>
                      {currencySymbol} {item.rate.toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.amountCol]}>
                    <Text style={styles.amountText}>
                      {currencySymbol} {item.total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.descCol]}>
                  <Text style={[styles.tableText, { textAlign: 'center' }]}>
                    No items added
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {currencySymbol} {invoice.subtotal?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.tax_rate || 0}%):</Text>
              <Text style={styles.totalValue}>
                {currencySymbol} {invoice.tax_amount?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>
                {currencySymbol} {invoice.total?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesTitle}>Notes:</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Thank you for your business!</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

function getCurrencySymbol(currency: string) {
  const currencyMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    PKR: '₨',
  };
  return currencyMap[currency] || '$';
}