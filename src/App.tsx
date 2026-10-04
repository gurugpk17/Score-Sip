import React from 'react';
import { useSessionStore } from './features/session/sessionStore';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/ui/Toast';
import { DashboardScreen } from './features/screens/DashboardScreen';
import { GameVariantSetupScreen } from './features/screens/GameVariantSetupScreen';
import { LiveScoreScreen } from './features/screens/LiveScoreScreen';
import { MatchResultsScreen } from './features/screens/MatchResultsScreen';
import { LedgerHistoryScreen } from './features/screens/LedgerHistoryScreen';
import { RankingsTeaWallScreen } from './features/screens/RankingsTeaWallScreen';
import { GameNightGalleryScreen } from './features/screens/GameNightGalleryScreen';
import { GameDetailsScreen } from './features/screens/GameDetailsScreen';
import { PhotoViewerModal } from './components/modals/PhotoViewerModal';
import { DeleteSnapModal } from './components/modals/DeleteSnapModal';
import { AddPhotoModal } from './components/modals/AddPhotoModal';

export default function App() {
  const { currentScreen, setScreen, activeSession } = useSessionStore();

  const getHeaderProps = () => {
    switch (currentScreen) {
      case 'dashboard':
        return { title: "RUMMY 7'S", subtitle: "Table Dashboard", showBack: false };
      case 'setup':
        return {
          title: "ROUND ENTRY PAD",
          subtitle: "Game & Table Setup",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'live':
        return {
          title: "ROUND ENTRY PAD",
          subtitle: activeSession ? `${activeSession.gameConfig.name} • Round ${activeSession.currentRoundNumber}` : "Live Score",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'results':
        return {
          title: "MATCH RESULTS",
          subtitle: "Official Scorecard & Verdict",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'ledger':
        return { title: "MATCH LEDGER", subtitle: "Session History", showBack: false };
      case 'rankings':
        return { title: "LEADERBOARD", subtitle: "Rankings & Tea Wall", showBack: false };
      case 'gallery':
        return { title: "GAME NIGHT GALLERY", subtitle: "Photo Memories & Moments", showBack: false };
      case 'game-details':
        return {
          title: "GAME DETAILS",
          subtitle: "Game Snaps & Ledger",
          showBack: true,
          onBack: () => setScreen('ledger')
        };
      default:
        return { title: "RUMMY 7'S", subtitle: "Dashboard", showBack: false };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] flex flex-col relative selection:bg-[#10b981] selection:text-[#003824]">
      {/* Dynamic Header */}
      <Header {...headerProps} />

      {/* Main Screen Container (Mobile-first centered max-w-md with desktop ambient support) */}
      <main className="flex-1 flex flex-col relative w-full pt-16 max-w-md mx-auto">
        <Toast />

        {currentScreen === 'dashboard' && <DashboardScreen />}
        {currentScreen === 'setup' && <GameVariantSetupScreen />}
        {currentScreen === 'live' && <LiveScoreScreen />}
        {currentScreen === 'results' && <MatchResultsScreen />}
        {currentScreen === 'ledger' && <LedgerHistoryScreen />}
        {currentScreen === 'rankings' && <RankingsTeaWallScreen />}
        {currentScreen === 'gallery' && <GameNightGalleryScreen />}
        {currentScreen === 'game-details' && <GameDetailsScreen />}

        {/* Global Photo Modals */}
        <PhotoViewerModal />
        <DeleteSnapModal />
        <AddPhotoModal />
      </main>

      {/* Bottom Navigation Dock */}
      <BottomNav />
    </div>
  );
}
