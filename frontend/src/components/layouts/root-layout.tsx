import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}; 