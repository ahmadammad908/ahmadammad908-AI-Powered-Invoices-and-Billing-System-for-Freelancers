import InvoiceForm from "./components/InvoiceForm"
import SecurityWrapper from './components/SecurityWrapper';

export default function Home() {
  return (
    <>
     <SecurityWrapper>
      {/* Your existing invoice component */}
      <InvoiceForm />
    </SecurityWrapper>
    </>
  );
}
