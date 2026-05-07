import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ShortlistProvider } from "@/contexts/ShortlistContext";

import AdminLayout from "@/components/layouts/AdminLayout";
import ShowroomLayout from "@/components/layouts/ShowroomLayout";
import SalesLayout from "@/components/layouts/SalesLayout";

import Dashboard from "@/pages/admin/Dashboard";
import Products from "@/pages/admin/Products";
import ProductDetail from "@/pages/admin/ProductDetail";
import Inventory from "@/pages/admin/Inventory";
import Orders from "@/pages/admin/Orders";
import OrderDetail from "@/pages/admin/OrderDetail";
import Customers from "@/pages/admin/Customers";
import CustomerDetail from "@/pages/admin/CustomerDetail";
import Payments from "@/pages/admin/Payments";
import Reports from "@/pages/admin/Reports";
import Settings from "@/pages/admin/Settings";

import Listing from "@/pages/showroom/Listing";
import ShowroomDetail from "@/pages/showroom/Detail";
import ShortlistPage from "@/pages/showroom/ShortlistPage";

import POS from "@/pages/sales/POS";
import SalesReturns from "@/pages/sales/Returns";
import StockCheck from "@/pages/sales/StockCheck";
import SalesInvoices from "@/pages/sales/Invoices";

import Home from "@/pages/Home";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ShortlistProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />

              {/* Admin */}
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/products" element={<Products />} />
                <Route path="/admin/products/:id" element={<ProductDetail />} />
                <Route path="/admin/inventory" element={<Inventory />} />
                <Route path="/admin/orders" element={<Orders />} />
                <Route path="/admin/orders/:id" element={<OrderDetail />} />
                <Route path="/admin/customers" element={<Customers />} />
                <Route path="/admin/customers/:id" element={<CustomerDetail />} />
                <Route path="/admin/payments" element={<Payments />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/settings" element={<Settings />} />
              </Route>

              {/* Sales POS */}
              <Route element={<SalesLayout />}>
                <Route path="/sales" element={<Navigate to="/sales/pos" replace />} />
                <Route path="/sales/pos" element={<POS />} />
                <Route path="/sales/returns" element={<SalesReturns />} />
                <Route path="/sales/stock" element={<StockCheck />} />
                <Route path="/sales/invoices" element={<SalesInvoices />} />
              </Route>

              {/* Showroom */}
              <Route element={<ShowroomLayout />}>
                <Route path="/showroom" element={<Listing />} />
                <Route path="/showroom/shortlist" element={<ShortlistPage />} />
                <Route path="/showroom/:productId" element={<ShowroomDetail />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ShortlistProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
