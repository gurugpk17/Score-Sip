import React, { useEffect } from 'react';
import { useSessionStore } from './features/session/sessionStore';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { MenuDrawer } from './components/layout/MenuDrawer';
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
  const { currentScreen, setScreen, activeSession, initializePersistence } = useSessionStore();

  useEffect(() => {
    initializePersistence();
  }, [initializePersistence]);

  const getHeaderProps = () => {
    switch (currentScreen) {
      case 'dashboard':
        return {
          title: "SCORE & SIP",
          subtitle: "Keep the score. Enjoy the game.",
          showBack: false
        };
      case 'setup':
        return {
          title: "START GAME",
          subtitle: "Variant & Table Setup",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'live':
        return {
          title: "ROUND ENTRY",
          subtitle: activeSession ? `${activeSession.gameConfig.name} • Round ${activeSession.currentRoundNumber}` : "Score Entry",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'results':
        return {
          title: "MATCH RESULTS",
          subtitle: "Scorecard & Final Standings",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'ledger':
        return {
          title: "PREVIOUS GAMES",
          subtitle: "Match History & Ledgers",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'rankings':
        return {
          title: "MY STATS",
          subtitle: "Player Standings & Tea Duties",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'gallery':
        return {
          title: "GAME MEMORIES",
          subtitle: "Game Snaps & Photos",
          showBack: true,
          onBack: () => setScreen('dashboard')
        };
      case 'game-details':
        return {
          title: "GAME DETAILS",
          subtitle: "Photos & Round Breakdown",
          showBack: true,
          onBack: () => setScreen('ledger')
        };
      default:
        return {
          title: "SCORE & SIP",
          subtitle: "Keep the score. Enjoy the game.",
          showBack: false
        };
    }
  };

  const headerProps = getHeaderProps();

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col relative selection:bg-[#10b981] selection:text-[#003824] transition-colors">
      {/* Dynamic Header */}
      <Header {...headerProps} />

      {/* Slide-out Menu Drawer */}
      <MenuDrawer />

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
