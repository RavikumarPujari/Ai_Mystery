import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { VoiceProvider } from "./context/VoiceContext";
import { VoiceIndicator } from "./components/voice/VoiceIndicator";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./pages/HomePage";
import { CreateMysteryPage } from "./pages/CreateMysteryPage";
import { InvestigationPage } from "./pages/InvestigationPage";
import { ResultsPage } from "./pages/ResultsPage";
import { HistoryPage } from "./pages/HistoryPage";

export function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <ToastProvider>
        <VoiceProvider>
          <div className="min-h-screen flex flex-col bg-detective-bg text-detective-text antialiased">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreateMysteryPage />} />
                <Route path="/case/:id" element={<InvestigationPage />} />
                <Route path="/case/:id/results" element={<ResultsPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Routes>
            </main>
            <Footer />
            <VoiceIndicator />
          </div>
        </VoiceProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
