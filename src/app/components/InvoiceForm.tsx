"use client";
import { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage, FieldArrayRenderProps } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideSave, LucideUsers, LucidePlus, LucideShield, LucideInfo, LucideTrash2, LucideSquarePen, LucideBuilding2, LucideEye, LucideDownload, LucideShare2, LucideCalendar, LucideGlobe, LucideSearch, LucideFilter, LucideUpload, LucideChevronLeft, LucideChevronRight, LucideCheckCircle, LucideAlertCircle } from "lucide-react";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { Invoice, Client, CompanyDetails, InvoiceItem } from '../../../lib/types';
import { supabase } from '../../../lib/database';
import Image from 'next/image';

// Validation Schema
const InvoiceSchema = Yup.object().shape({
  invoice_number: Yup.string().required('Invoice number is required'),
  date: Yup.date().required('Date is required'),
  due_date: Yup.date().required('Due date is required'),
  tax_rate: Yup.number().min(0).max(100),
  currency: Yup.string().required('Currency is required'),
  items: Yup.array()
    .of(
      Yup.object().shape({
        rate: Yup.number().min(0).required('Rate is required'),
        quantity: Yup.number().min(1).required('Quantity is required'),
      })
    )
    .min(1, 'At least one item is required'),
});

// Initial Values
const getInitialValues = (): Invoice => ({
  id: '',
  invoice_number: `INV-${Math.floor(Math.random() * 10000)}`,
  date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'draft',
  currency: 'USD',
  tax_rate: 0,
  client: {
    id: '',
    name: '',
    email: '',
    address: '',
    phone: '',
    vat: ''
  },
  company: {
    id: '',
    name: '',
    email: '',
    address: '',
    logo: null
  },
  items: [
    { id: '1', description: '', quantity: 1, rate: 0, total: 0 }
  ],
  notes: 'Payment due within 14 days. Thank you for your business!',
  subtotal: 0,
  tax_amount: 0,
  total: 0,
  created_at: new Date().toISOString()
});

// Currency Options with Symbols
const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound (£)', symbol: '£' },
  { value: 'PKR', label: 'PKR - Pakistani Rupee (₨)', symbol: '₨' },
];

type ToastType = {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
};

export default function InvoiceForm() {
  // State
  const [activeTab, setActiveTab] = useState<'details' | 'preview' | 'history'>('details');
  const [companies, setCompanies] = useState<CompanyDetails[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [companyFormData, setCompanyFormData] = useState<Omit<CompanyDetails, 'id'>>({
    name: '',
    email: '',
    address: '',
    logo: null
  });
  const [clientFormData, setClientFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    vat: '',
    address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCompanySaving, setIsCompanySaving] = useState(false);
  const [isClientSaving, setIsClientSaving] = useState(false);
  const [toast, setToast] = useState<ToastType>({
    message: '',
    type: 'success',
    visible: false
  });
  const invoicesPerPage = 5;
  const previewRef = useRef<HTMLDivElement>(null);

  // Toast auto-dismiss after 3 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Fetch companies and clients from Supabase on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*');

      if (error) {
        console.error('Error fetching companies:', error);
        setToast({ message: 'Failed to fetch companies.', type: 'error', visible: true });
        return;
      }
      setCompanies(data || []);
    };

    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*');

      if (error) {
        console.error('Error fetching clients:', error);
        setToast({ message: 'Failed to fetch clients.', type: 'error', visible: true });
        return;
      }
      setClients(data || []);
    };

    fetchCompanies();
    fetchClients();
  }, []);

  // Calculate invoice totals
  const calculateTotals = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    const tax_amount = subtotal * (taxRate / 100);
    const total = subtotal + tax_amount;
    return { subtotal, tax_amount, total };
  };

  // Handle download as PDF
  const handleDownloadPDF = () => {
    const currentInvoice = invoices.length > 0 ? invoices[0] : {
      ...getInitialValues(),
      client: selectedClient || {
        id: '',
        name: '',
        email: '',
        address: '',
        phone: '',
        vat: ''
      },
      company: selectedCompany || {
        id: '',
        name: '',
        email: '',
        address: '',
        logo: null
      },
      ...calculateTotals([{ id: '1', description: '', quantity: 1, rate: 0, total: 0 }], 0)
    };

    return (
      <PDFDownloadLink
        document={<InvoicePDF invoice={currentInvoice} />}
        fileName={`invoice_${currentInvoice.invoice_number}.pdf`}
      >
        {({ loading }) => (
          <span className="flex items-center space-x-2">
            <LucideDownload className="w-4 h-4" />
            <span className="text-sm sm:text-base">
              {loading ? 'Loading document...' : 'Download PDF'}
            </span>
          </span>
        )}
      </PDFDownloadLink>
    );
  };

  // Handle share
  const handleShare = async () => {
    try {
      if (!navigator.share) {
        setToast({ message: 'Sharing not supported. Downloading instead.', type: 'error', visible: true });
        return;
      }

      const currentInvoice = invoices[0] || {
        ...getInitialValues(),
        client: selectedClient || {
          id: '',
          name: '',
          email: '',
          address: '',
          phone: '',
          vat: ''
        },
        company: selectedCompany || {
          id: '',
          name: '',
          email: '',
          address: '',
          logo: null
        },
        ...calculateTotals([{ id: '1', description: '', quantity: 1, rate: 0, total: 0 }], 0)
      };

      const pdfBlob = await generatePdfBlob(currentInvoice);
      await navigator.share({
        title: `Invoice ${currentInvoice.invoice_number}`,
        text: `Invoice from ${currentInvoice.company.name}`,
        files: [new File([pdfBlob], `invoice_${currentInvoice.invoice_number}.pdf`, { type: 'application/pdf' })]
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      setToast({ message: 'Failed to share invoice.', type: 'error', visible: true });
    }
  };

  // Helper function to generate PDF as Blob
  const generatePdfBlob = async (invoice: Invoice) => {
    // In a real implementation, you would use a PDF generation library
    // This is a placeholder - you'll need to implement actual PDF generation
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice }),
    });
    return await response.blob();
  };

  // Handle save invoice
  const handleSaveInvoice = () => {
    if (!invoices.length) return;

    const updatedInvoices = [...invoices];
    const existingIndex = updatedInvoices.findIndex(inv => inv.id === invoices[0].id);

    if (existingIndex >= 0) {
      updatedInvoices[existingIndex] = invoices[0];
    } else {
      updatedInvoices.unshift(invoices[0]);
    }

    setInvoices(updatedInvoices);
    setActiveTab('history');
    setToast({ message: 'Invoice saved successfully.', type: 'success', visible: true });
  };

  // Handle company form
  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyFormData(prev => ({ ...prev, logo: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyFormData.name) {
      setToast({ message: 'Company name is required.', type: 'error', visible: true });
      return;
    }

    setIsCompanySaving(true);
    const companyData = {
      id: selectedCompany?.id || Date.now().toString(),
      ...companyFormData
    };

    try {
      if (selectedCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: companyData.name,
            email: companyData.email,
            address: companyData.address,
            logo: companyData.logo
          })
          .eq('id', companyData.id);

        if (error) throw error;

        setCompanies(companies.map(c => c.id === companyData.id ? companyData : c));
      } else {
        // Insert new company
        const { error } = await supabase
          .from('companies')
          .insert([companyData]);

        if (error) throw error;

        setCompanies([...companies, companyData]);
      }

      setSelectedCompany(companyData);
      setShowCompanyForm(false);
      setCompanyFormData({ name: '', email: '', address: '', logo: null });
      setToast({ message: 'Company saved successfully.', type: 'success', visible: true });
    } catch (error) {
      console.error('Error saving company:', error);
      setToast({ message: 'Failed to save company. Please try again.', type: 'error', visible: true });
    } finally {
      setIsCompanySaving(false);
    }
  };

  // Handle client form
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClient = async () => {
    if (!clientFormData.name) {
      setToast({ message: 'Client name is required.', type: 'error', visible: true });
      return;
    }

    setIsClientSaving(true);
    const clientData = {
      id: selectedClient?.id || Date.now().toString(),
      ...clientFormData
    };

    try {
      if (selectedClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            vat: clientData.vat,
            address: clientData.address
          })
          .eq('id', clientData.id);

        if (error) throw error;

        setClients(clients.map(c => c.id === clientData.id ? clientData : c));
      } else {
        // Insert new client
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;

        setClients([...clients, clientData]);
      }

      setSelectedClient(clientData);
      setShowClientForm(false);
      setClientFormData({ name: '', email: '', phone: '', vat: '', address: '' });
      setToast({ message: 'Client saved successfully.', type: 'success', visible: true });
    } catch (error) {
      console.error('Error saving client:', error);
      setToast({ message: 'Failed to save client. Please try again.', type: 'error', visible: true });
    } finally {
      setIsClientSaving(false);
    }
  };

  // Handle delete company
  const handleDeleteCompany = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      setCompanies(companies.filter(c => c.id !== companyId));
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
      }
      setToast({ message: 'Company deleted successfully.', type: 'success', visible: true });
    } catch (error) {
      console.error('Error deleting company:', error);
      setToast({ message: 'Failed to delete company.', type: 'error', visible: true });
    }
  };

  // Handle delete client
  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(clients.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      setToast({ message: 'Client deleted successfully.', type: 'success', visible: true });
    } catch (error) {
      console.error('Error deleting client:', error);
      setToast({ message: 'Failed to delete client.', type: 'error', visible: true });
    }
  };

  // Handle invoice submission
  const handleSubmitInvoice = (values: Invoice) => {
    if (!selectedCompany || !selectedClient) {
      setToast({ message: 'Please select a company and client before saving the invoice.', type: 'error', visible: true });
      return;
    }

    const invoiceData: Invoice = {
      ...values,
      id: values.id || Date.now().toString(),
      client: selectedClient,
      company: selectedCompany,
      status: 'draft',
      created_at: new Date().toISOString(),
      ...calculateTotals(values.items, values.tax_rate)
    };

    setInvoices([invoiceData, ...invoices]);
    setActiveTab('preview');
    setToast({ message: 'Invoice created successfully.', type: 'success', visible: true });
  };

  // Handle invoice actions
  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter(invoice => invoice.id !== id));
    setToast({ message: 'Invoice deleted successfully.', type: 'success', visible: true });
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedClient(invoice.client);
    setSelectedCompany(invoice.company);
    setActiveTab('details');
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const option = currencyOptions.find(opt => opt.value === currency);
    return option?.symbol || '$';
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 z-50 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
          >
            {toast.type === 'success' ? (
              <LucideCheckCircle className="w-5 h-5" />
            ) : (
              <LucideAlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-black">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-32 left-1/3 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse animation-delay-3000"></div>
        </div>
        <div className="relative z-10">
          <header className="relative">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border-b border-white/10"></div>
            <div className="relative container mx-auto px-4 py-6">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3 group">
                  <div className="p-3 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-xl shadow-2xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 border border-blue-400/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-8 h-8 text-blue-400">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                      <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                      <path d="M10 9H8"></path>
                      <path d="M16 13H8"></path>
                      <path d="M16 17H8"></path>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">ABCInvoice</h1>
                    <p className="text-gray-400 text-sm">Generate Beautiful Invoices in Seconds for FREE</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <div className='relative z-10'>
            <main className='container mx-auto px-4 py-8'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Left Sidebar */}
                <div className='lg:col-span-1 space-y-6'>
                  {/* Company Details */}
                  <div className='bg-gray-800/10 backdrop-blur-xl rounded-2xl border border-gray-600 p-6 shadow-lg shadow-blue-500/10'>
                    <div className='flex items-center space-x-3 mb-6'>
                      <div className="p-2 bg-purple-500/20 rounded-lg shadow-lg shadow-purple-500/20">
                        <LucideBuilding2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Company Details</h2>
                    </div>
                    {showCompanyForm ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Company Name *"
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-gray-800/30 transition-all duration-200"
                          name="name"
                          value={companyFormData.name}
                          onChange={handleCompanyInputChange}
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email Address (optional)"
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-gray-800/30 transition-all duration-200"
                          name="email"
                          value={companyFormData.email || ''}
                          onChange={handleCompanyInputChange}
                        />
                        <textarea
                          placeholder="Address (optional)"
                          rows={3}
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-gray-800/30 transition-all duration-200 resize-none"
                          name="address"
                          value={companyFormData.address || ''}
                          onChange={handleCompanyInputChange}
                        ></textarea>
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">Company Logo</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="company-logo-upload"
                              onChange={handleLogoUpload}
                            />
                            <label
                              htmlFor="company-logo-upload"
                              className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-gray-800/10 transition-all duration-200"
                            >
                              {companyFormData.logo ? (
                                <div className="text-center">
                                  <Image src={companyFormData.logo} alt="Company Logo" width={64} height={64} className="h-16 mx-auto mb-2 rounded" />
                                  <p className="text-sm text-gray-300">Click to change logo</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <LucideUpload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-300 text-sm font-medium">Upload Logo</p>
                                  <p className="text-gray-400 text-xs">PNG, JPG, SVG up to 10MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleSaveCompany}
                            disabled={!companyFormData.name || isCompanySaving}
                            className="flex-1 p-3 bg-green-600/20 border border-green-500 rounded-lg text-green-400 font-medium hover:bg-green-600/30 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isCompanySaving ? (
                              <>
                                <svg className="animate-spin w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"></path>
                                </svg>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <LucideSave className="w-4 h-4" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowCompanyForm(false)}
                            disabled={isCompanySaving}
                            className="px-4 py-3 bg-gray-600/20 border border-gray-500 rounded-lg text-gray-400 font-medium hover:bg-gray-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedCompany ? (
                          <div className="mb-6 p-4 bg-gray-800/20 rounded-lg border border-gray-600">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-4">
                                  {selectedCompany.logo && (
                                    <div className="flex-shrink-0">
                                      <Image
                                        src={selectedCompany.logo}
                                        alt="Company Logo"
                                        width={80}
                                        height={80}
                                        className="h-16 w-16 object-contain rounded border border-gray-600"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{selectedCompany.name}</p>
                                    {selectedCompany.email && <p className="text-gray-300 text-sm truncate">{selectedCompany.email}</p>}
                                    {selectedCompany.address && (
                                      <p className="text-gray-300 text-sm mt-1 whitespace-pre-line">
                                        {selectedCompany.address}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-1 flex-shrink-0">
                                <button
                                  className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                                  onClick={() => {
                                    setCompanyFormData({
                                      name: selectedCompany.name,
                                      email: selectedCompany.email || '',
                                      address: selectedCompany.address || '',
                                      logo: selectedCompany.logo || null
                                    });
                                    setShowCompanyForm(true);
                                  }}
                                >
                                  <LucideSquarePen className="w-4 h-4 text-purple-400" />
                                </button>
                                <button
                                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                  onClick={() => handleDeleteCompany(selectedCompany.id)}
                                >
                                  <LucideTrash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm mb-4">No company selected</p>
                        )}
                        <button
                          onClick={() => {
                            setCompanyFormData({ name: '', email: '', address: '', logo: null });
                            setShowCompanyForm(true);
                          }}
                          className="w-full p-3 bg-purple-500/20 border border-purple-400 rounded-lg text-purple-400 font-medium hover:bg-purple-500/30 hover:border-purple-400 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/10"
                        >
                          <LucidePlus className="w-4 h-4" />
                          <span>{selectedCompany ? 'Change Company' : 'Add Company'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Client Details */}
                  <div className='bg-gray-800/10 backdrop-blur-xl rounded-2xl border border-gray-600 p-6 shadow-lg shadow-blue-500/10'>
                    <div className='flex items-center space-x-3 mb-6'>
                      <div className="p-2 bg-blue-500/20 rounded-lg shadow-lg shadow-blue-500/20">
                        <LucideUsers className="w-5 h-5 text-blue-400" />
                      </div>
                      <h2 className="text-xl font-semibold text-white">Client Details</h2>
                    </div>
                    {showClientForm ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Client Name *"
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                          name="name"
                          value={clientFormData.name}
                          onChange={handleClientInputChange}
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email Address (optional)"
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                          name="email"
                          value={clientFormData.email || ''}
                          onChange={handleClientInputChange}
                        />
                        <input
                          type="tel"
                          placeholder="Phone Number (optional)"
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                          name="phone"
                          value={clientFormData.phone || ''}
                          onChange={handleClientInputChange}
                        />
                        <input
                          type="text"
                          placeholder="VAT Number (optional)"
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                          name="vat"
                          value={clientFormData.vat || ''}
                          onChange={handleClientInputChange}
                        />
                        <textarea
                          placeholder="Address (optional)"
                          rows={3}
                          className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200 resize-none"
                          name="address"
                          value={clientFormData.address || ''}
                          onChange={handleClientInputChange}
                        ></textarea>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleSaveClient}
                            disabled={!clientFormData.name || isClientSaving}
                            className="flex-1 p-3 bg-green-600/20 border border-green-500 rounded-lg text-green-400 font-medium hover:bg-green-600/30 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isClientSaving ? (
                              <>
                                <svg className="animate-spin w-4 h-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"></path>
                                </svg>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <LucideSave className="w-4 h-4" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowClientForm(false)}
                            disabled={isClientSaving}
                            className="px-4 py-3 bg-gray-600/20 border border-gray-500 rounded-lg text-gray-400 font-medium hover:bg-gray-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedClient ? (
                          <div className="mb-6 p-4 bg-gray-800/20 rounded-lg border border-gray-600">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{selectedClient.name}</p>
                                {selectedClient.email && <p className="text-gray-300 text-sm">{selectedClient.email}</p>}
                                {selectedClient.phone && <p className="text-gray-300 text-sm">{selectedClient.phone}</p>}
                                {selectedClient.address && <p className="text-gray-300 text-sm">{selectedClient.address}</p>}
                                {selectedClient.vat && <p className="text-gray-400 text-xs">VAT: {selectedClient.vat}</p>}
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                                  onClick={() => {
                                    setClientFormData({
                                      name: selectedClient.name,
                                      email: selectedClient.email || '',
                                      phone: selectedClient.phone || '',
                                      vat: selectedClient.vat || '',
                                      address: selectedClient.address || ''
                                    });
                                    setShowClientForm(true);
                                  }}
                                >
                                  <LucideSquarePen className="w-4 h-4 text-blue-400" />
                                </button>
                                <button
                                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                  onClick={() => handleDeleteClient(selectedClient.id)}
                                >
                                  <LucideTrash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm mb-4">No client selected</p>
                        )}
                        <button
                          onClick={() => {
                            setClientFormData({ name: '', email: '', phone: '', vat: '', address: '' });
                            setShowClientForm(true);
                          }}
                          className="w-full p-3 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-400 font-medium hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/10"
                        >
                          <LucidePlus className="w-4 h-4" />
                          <span>{selectedClient ? 'Change Client' : 'Add Client'}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Privacy Notice */}
                  <div className="bg-green-600/10 backdrop-blur-xl rounded-xl border border-green-500/20 p-4 shadow-lg shadow-green-500/10">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-600/20 rounded-lg shadow-lg shadow-green-500/20 flex-shrink-0">
                        <LucideShield className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base font-semibold text-green-400">100% Private & Secure</h3>
                          <LucideInfo className="w-3 h-3 text-green-400/70" />
                        </div>
                        <p className="text-sm text-green-300/80 leading-relaxed">
                          <strong>Your data is securely stored.</strong> All client and company information is stored securely in Supabase. Ensure your database is properly configured for access.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className='lg:col-span-2'>
                  <div className='bg-gray-800/10 backdrop-blur-xl rounded-2xl border border-gray-600 shadow-lg shadow-blue-500/10 overflow-hidden'>
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-600">
                      <button
                        className={`flex-1 p-4 flex items-center justify-center space-x-2 transition-all duration-200 ${activeTab === 'details'
                          ? 'bg-blue-500/20 text-white border-b-2 border-blue-400 shadow-lg shadow-blue-500/20'
                          : 'text-gray-300 hover:bg-gray-800/10 hover:text-white'
                          }`}
                        onClick={() => setActiveTab('details')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                          <path d="M10 9H8"></path>
                          <path d="M16 13H8"></path>
                          <path d="M16 17H8"></path>
                        </svg>
                        <span className="font-medium hidden sm:inline">Invoice Details</span>
                      </button>
                      <button
                        className={`flex-1 p-4 flex items-center justify-center space-x-2 transition-all duration-200 ${activeTab === 'preview'
                          ? 'bg-blue-500/20 text-white border-b-2 border-blue-400 shadow-lg shadow-blue-500/20'
                          : 'text-gray-300 hover:bg-gray-800/10 hover:text-white'
                          }`}
                        onClick={() => setActiveTab('preview')}
                      >
                        <LucideEye className="w-4 h-4" />
                        <span className="font-medium hidden sm:inline">Preview</span>
                      </button>
                      <button
                        className={`flex-1 p-4 flex items-center justify-center space-x-2 transition-all duration-200 ${activeTab === 'history'
                          ? 'bg-blue-500/20 text-white border-b-2 border-blue-400 shadow-lg shadow-blue-500/20'
                          : 'text-gray-300 hover:bg-gray-800/10 hover:text-white'
                          }`}
                        onClick={() => setActiveTab('history')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                          <path d="M12 7v5l4 2"></path>
                        </svg>
                        <span className="font-medium hidden sm:inline">My Invoices</span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 sm:p-8">
                      {/* Invoice Details Tab */}
                      {activeTab === 'details' && (
                        <Formik
                          initialValues={getInitialValues()}
                          validationSchema={InvoiceSchema}
                          onSubmit={handleSubmitInvoice}
                        >
                          {({ values, setFieldValue }) => {
                            const { subtotal, tax_amount, total } = calculateTotals(values.items, values.tax_rate);

                            return (
                              <Form className="space-y-6">
                                <h3 className="text-2xl font-semibold text-white mb-6">Invoice Details</h3>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                  <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Invoice Number</label>
                                    <Field
                                      type="text"
                                      name="invoice_number"
                                      className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                    />
                                    <ErrorMessage name="invoice_number" component="div" className="text-red-400 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Date</label>
                                    <div className="relative">
                                      <Field
                                        type="date"
                                        name="date"
                                        className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                      />
                                      <LucideCalendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    <ErrorMessage name="date" component="div" className="text-red-400 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Due Date</label>
                                    <div className="relative">
                                      <Field
                                        type="date"
                                        name="due_date"
                                        className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                      />
                                      <LucideCalendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    <ErrorMessage name="due_date" component="div" className="text-red-400 text-sm mt-1" />
                                  </div>
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Currency</label>
                                    <div className="relative">
                                      <Field
                                        as="select"
                                        name="currency"
                                        className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200 appearance-none cursor-pointer"
                                      >
                                        {currencyOptions.map(option => (
                                          <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                                            {option.label}
                                          </option>
                                        ))}
                                      </Field>
                                      <LucideGlobe className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    <ErrorMessage name="currency" component="div" className="text-red-400 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">Tax Rate (%)</label>
                                    <Field
                                      type="number"
                                      name="tax_rate"
                                      className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                      placeholder="0"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                    />
                                    <ErrorMessage name="tax_rate" component="div" className="text-red-400 text-sm mt-1" />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-white">Invoice Items</h4>
                                    <FieldArray name="items">
                                      {({ push }: FieldArrayRenderProps) => (
                                        <button
                                          type="button"
                                          onClick={() => push({
                                            id: Date.now().toString(),
                                            description: '',
                                            quantity: 1,
                                            rate: 0,
                                            total: 0
                                          })}
                                          className="p-2 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-blue-500/10"
                                        >
                                          <LucidePlus className="w-4 h-4" />
                                          <span className="hidden sm:inline">Add Item</span>
                                        </button>
                                      )}
                                    </FieldArray>
                                  </div>
                                  <FieldArray name="items">
                                    {({ remove }: FieldArrayRenderProps) => (
                                      <div className='space-y-3'>
                                        {values.items.map((item, index) => (
                                          <div key={item.id} className="p-4 bg-gray-800/10 rounded-lg border border-gray-600">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                              <div className="md:col-span-5">
                                                <label className="block text-gray-300 text-sm font-medium mb-1">Description</label>
                                                <Field
                                                  type="text"
                                                  name={`items.${index}.description`}
                                                  className="w-full p-2 bg-gray-800/20 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                                  placeholder="Item description"
                                                />
                                                <ErrorMessage name={`items.${index}.description`} component="div" className="text-red-400 text-sm mt-1" />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-gray-300 text-sm font-medium mb-1">Quantity</label>
                                                <Field
                                                  type="number"
                                                  name={`items.${index}.quantity`}
                                                  className="w-full p-2 bg-gray-800/20 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                                  min="1"
                                                  step="1"
                                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const quantity = parseInt(e.target.value) || 0;
                                                    const rate = values.items[index].rate || 0;
                                                    setFieldValue(`items.${index}.quantity`, quantity);
                                                    setFieldValue(`items.${index}.total`, quantity * rate);
                                                  }}
                                                />
                                                <ErrorMessage name={`items.${index}.quantity`} component="div" className="text-red-400 text-sm mt-1" />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-gray-300 text-sm font-medium mb-1">Rate</label>
                                                <Field
                                                  type="number"
                                                  name={`items.${index}.rate`}
                                                  className="w-full p-2 bg-gray-800/20 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                                  min="0"
                                                  step="0.01"
                                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const rate = parseFloat(e.target.value) || 0;
                                                    const quantity = values.items[index].quantity || 0;
                                                    setFieldValue(`items.${index}.rate`, rate);
                                                    setFieldValue(`items.${index}.total`, quantity * rate);
                                                  }}
                                                />
                                                <ErrorMessage name={`items.${index}.rate`} component="div" className="text-red-400 text-sm mt-1" />
                                              </div>
                                              <div className="md:col-span-2">
                                                <label className="block text-gray-300 text-sm font-medium mb-1">Total</label>
                                                <div className="p-2 bg-gray-600/20 border border-gray-500 rounded text-gray-300">
                                                  {getCurrencySymbol(values.currency)} {(values.items[index].quantity * values.items[index].rate).toFixed(2)}
                                                </div>
                                              </div>
                                              <div className="md:col-span-1">
                                                <button
                                                  type="button"
                                                  onClick={() => remove(index)}
                                                  className="p-2 bg-red-500/20 border border-red-400 rounded text-red-400 hover:bg-red-500/30 hover:border-red-400 transition-all duration-200 shadow-lg shadow-red-500/10"
                                                >
                                                  <LucideTrash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </FieldArray>
                                  <ErrorMessage name="items" component="div" className="text-red-400 text-sm mt-1" />
                                </div>
                                <div>
                                  <label className="block text-gray-300 text-sm font-medium mb-2">Notes</label>
                                  <Field
                                    as="textarea"
                                    name="notes"
                                    rows={3}
                                    className="w-full p-3 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200 resize-none"
                                    placeholder="Additional notes or payment terms"
                                  />
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-600 gap-4">
                                  <div className="text-gray-300 w-full sm:w-auto">
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span className="ml-4">{getCurrencySymbol(values.currency)} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Tax ({values.tax_rate}%):</span>
                                      <span className="ml-4">{getCurrencySymbol(values.currency)} {tax_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg mt-2">
                                      <span>Total:</span>
                                      <span className="ml-4">{getCurrencySymbol(values.currency)} {total.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  <button
                                    type="submit"
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-400 font-medium hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-200 shadow-lg shadow-blue-500/10"
                                  >
                                    Save Invoice
                                  </button>
                                </div>
                              </Form>
                            );
                          }}
                        </Formik>
                      )}
                      {/* Preview Tab */}
                      {activeTab === 'preview' && (
                        <div className='space-y-6'>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <button
                              onClick={handleSaveInvoice}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/70 text-green-400 shadow-lg shadow-green-500/20"
                            >
                              <LucideSave className="w-4 h-4" />
                              <span className="text-sm sm:text-base">Save Invoice</span>
                            </button>
                            <button className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/50 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/70 text-blue-400 shadow-lg shadow-blue-500/20">
                              {handleDownloadPDF()}
                            </button>
                            <button
                              onClick={handleShare}
                              disabled={!invoices.length}
                              className="flex-none inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/50 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/70 text-purple-400 shadow-lg shadow-purple-500/20"
                            >
                              <LucideShare2 className="w-4 h-4" />
                              <span className="hidden sm:inline text-sm">Share</span>
                            </button>
                          </div>
                          <div ref={previewRef} id="invoice-preview-container" className="bg-white rounded-xl p-4 sm:p-8 text-gray-800 shadow-lg max-w-4xl mx-auto">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 space-y-4 sm:space-y-0">
                              <div className="w-full sm:w-auto">
                                {selectedCompany?.logo && (
                                  <Image src={selectedCompany.logo} alt="Company Logo" width={64} height={64} className="h-16 mb-4" />
                                )}
                                <h2 className="text-lg sm:text-xl font-semibold">{selectedCompany?.name || 'Your Company'}</h2>
                                {selectedCompany?.email && <p className="text-gray-600 text-sm sm:text-base">{selectedCompany.email}</p>}
                                {selectedCompany?.address && <p className="text-gray-600 text-sm sm:text-base">{selectedCompany.address}</p>}
                              </div>
                              <div className="text-left sm:text-right w-full sm:w-auto">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">INVOICE</h1>
                                <p className="text-gray-600 text-sm sm:text-base">#{invoices[0]?.invoice_number || 'INV-0001'}</p>
                                <div className="mt-4 space-y-1">
                                  <div className="text-xs sm:text-sm">
                                    <span className="text-gray-600">Invoice Date: </span>
                                    <span className="text-gray-800">{invoices[0]?.date || 'Not set'}</span>
                                  </div>
                                  <div className="text-xs sm:text-sm">
                                    <span className="text-gray-600">Due Date: </span>
                                    <span className="text-gray-800">{invoices[0]?.due_date || 'Not set'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
                              <div>
                                <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Bill To:</h3>
                                <div className="text-gray-600 text-sm sm:text-base">
                                  <p className="font-medium">{selectedClient?.name || 'Client Name'}</p>
                                  {selectedClient?.email && <p>{selectedClient.email}</p>}
                                  {selectedClient?.address && <p>{selectedClient.address}</p>}
                                  {selectedClient?.vat && <p>VAT: {selectedClient.vat}</p>}
                                </div>
                              </div>
                              <div></div>
                            </div>
                            <div className="mb-8 overflow-x-auto">
                              <table className="w-full min-w-full">
                                <thead>
                                  <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 text-gray-700 font-semibold text-xs sm:text-sm">Description</th>
                                    <th className="text-center py-3 text-gray-700 font-semibold text-xs sm:text-sm">Qty</th>
                                    <th className="text-right py-3 text-gray-700 font-semibold text-xs sm:text-sm">Rate</th>
                                    <th className="text-right py-3 text-gray-700 font-semibold text-xs sm:text-sm">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invoices[0]?.items?.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100">
                                      <td className="py-3 text-gray-800 text-xs sm:text-sm">{item.description}</td>
                                      <td className="py-3 text-center text-gray-600 text-xs sm:text-sm">{item.quantity}</td>
                                      <td className="py-3 text-right text-gray-600 text-xs sm:text-sm">{getCurrencySymbol(invoices[0]?.currency || 'USD')} {item.rate.toFixed(2)}</td>
                                      <td className="py-3 text-right text-gray-800 font-medium text-xs sm:text-sm">{getCurrencySymbol(invoices[0]?.currency || 'USD')} {(item.quantity * item.rate).toFixed(2)}</td>
                                    </tr>
                                  )) || (
                                      <tr>
                                        <td colSpan={4} className="py-3 text-gray-600 text-sm text-center">No items added</td>
                                      </tr>
                                    )}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex justify-end mb-8">
                              <div className="w-full sm:w-64">
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                  <span className="text-gray-600 text-sm sm:text-base">Subtotal:</span>
                                  <span className="text-gray-800 text-sm sm:text-base">{getCurrencySymbol(invoices[0]?.currency || 'USD')} {invoices[0]?.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                  <span className="text-gray-600 text-sm sm:text-base">Tax ({invoices[0]?.tax_rate || 0}%):</span>
                                  <span className="text-gray-800 text-sm sm:text-base">{getCurrencySymbol(invoices[0]?.currency || 'USD')} {invoices[0]?.tax_amount?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between py-3 border-b-2 border-gray-800">
                                  <span className="text-base sm:text-lg font-semibold text-gray-800">Total:</span>
                                  <span className="text-base sm:text-lg font-bold text-gray-800">{getCurrencySymbol(invoices[0]?.currency || 'USD')} {invoices[0]?.total?.toFixed(2) || '0.00'}</span>
                                </div>
                              </div>
                            </div>
                            {invoices[0]?.notes && (
                              <div className="mb-8">
                                <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Notes:</h3>
                                <p className="text-gray-600 text-sm sm:text-base">{invoices[0].notes}</p>
                              </div>
                            )}
                            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-xs sm:text-sm">
                              <p>Thank you for your business!</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* My Invoices Tab */}
                      {activeTab === 'history' && (
                        <div className="space-y-6">
                          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6">My Invoices</h3>
                          <div className='bg-gray-800/10 backdrop-blur-xl rounded-xl border border-gray-600 p-6'>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
                              <div className="relative w-full max-w-md">
                                <input
                                  type="text"
                                  placeholder="Search invoices..."
                                  className="w-full pl-10 pr-4 py-2 bg-gray-800/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-gray-800/30 transition-all duration-200"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <LucideSearch className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                              </div>
                              <button className="w-full sm:w-auto px-4 py-2 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-200 flex items-center space-x-2">
                                <LucideFilter className="w-4 h-4" />
                                <span>Filter</span>
                              </button>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[640px] sm:min-w-full">
                                <thead>
                                  <tr className="border-b border-gray-600 text-gray-300 text-left text-sm">
                                    <th className="pb-3 font-medium py-2 px-3">Invoice #</th>
                                    <th className="pb-3 font-medium py-2 px-3">Client</th>
                                    <th className="pb-3 font-medium py-2 px-3 text-right">Amount</th>
                                    <th className="pb-3 font-medium py-2 px-3 hidden sm:table-cell">Date</th>
                                    <th className="pb-3 font-medium py-2 px-3 hidden sm:table-cell">Status</th>
                                    <th className="pb-3 font-medium py-2 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentInvoices.length > 0 ? (
                                    currentInvoices.map(invoice => (
                                      <tr key={invoice.id} className="border-b border-gray-600 hover:bg-gray-800/10">
                                        <td className="py-4 px-3 text-white text-sm">{invoice.invoice_number}</td>
                                        <td className="py-4 px-3 text-gray-300 text-sm">{invoice.client.name}</td>
                                        <td className="py-4 px-3 text-white text-sm text-right">{getCurrencySymbol(invoice.currency)} {invoice.total.toFixed(2)}</td>
                                        <td className="py-4 px-3 text-gray-300 text-sm hidden sm:table-cell">{invoice.date}</td>
                                        <td className="py-4 px-3 hidden sm:table-cell">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid' ? 'bg-green-600/20 text-green-400' :
                                            invoice.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                                              invoice.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                                                'bg-gray-600/20 text-gray-400'
                                            }`}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                          </span>
                                        </td>
                                        <td className="py-4 px-3 text-right">
                                          <div className="flex justify-end space-x-2">
                                            <button
                                              className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                                              onClick={() => {
                                                setSelectedClient(invoice.client);
                                                setSelectedCompany(invoice.company);
                                                setActiveTab('preview');
                                              }}
                                            >
                                              <LucideEye className="w-4 h-4" />
                                            </button>
                                            <button
                                              className="p-1.5 text-gray-400 hover:bg-gray-600/20 rounded-lg"
                                              onClick={() => handleEditInvoice(invoice)}
                                            >
                                              <LucideSquarePen className="w-4 h-4" />
                                            </button>
                                            <button
                                              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg"
                                              onClick={() => handleDeleteInvoice(invoice.id)}
                                            >
                                              <LucideTrash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={6} className="py-4 px-3 text-gray-400 text-sm text-center">No invoices found.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between mt-6">
                                <button
                                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={currentPage === 1}
                                  className="p-2 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <LucideChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-gray-300">
                                  Page {currentPage} of {totalPages}
                                </span>
                                <button
                                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                  disabled={currentPage === totalPages}
                                  className="p-2 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <LucideChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}