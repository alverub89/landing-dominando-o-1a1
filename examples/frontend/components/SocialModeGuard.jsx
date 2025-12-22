/**
 * Social Mode Guard Component
 * 
 * Protects routes from being accessed when the event is in social mode.
 * Shows a friendly message instead of a broken page or 404.
 * 
 * @module components/SocialModeGuard
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocialMode, useMode } from '../contexts/FeatureContext';
import './SocialModeGuard.css'; // Optional styling

/**
 * Guard component that blocks access to gamification features in social mode
 * 
 * @example
 * // In your routes:
 * <Route 
 *   path="/missions/*" 
 *   element={
 *     <SocialModeGuard>
 *       <MissionsModule />
 *     </SocialModeGuard>
 *   } 
 * />
 */
export function SocialModeGuard({ children, moduleName = 'módulo' }) {
  const isSocialMode = useSocialMode();
  const mode = useMode();
  const navigate = useNavigate();
  
  if (!isSocialMode) {
    return children;
  }
  
  return (
    <div className="social-mode-guard">
      <div className="social-mode-guard__content">
        <div className="social-mode-guard__icon">
          🌐
        </div>
        
        <h2 className="social-mode-guard__title">
          Módulo Desativado
        </h2>
        
        <p className="social-mode-guard__message">
          Este evento está no <strong>modo social</strong>. 
          O {moduleName} está desativado.
        </p>
        
        <div className="social-mode-guard__info">
          <h3>No modo social, você pode:</h3>
          <ul>
            {mode.availableFeatures.map(feature => (
              <li key={feature}>
                {getFeatureDisplayName(feature)}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="social-mode-guard__actions">
          <button 
            className="button button--primary"
            onClick={() => navigate('/feed')}
          >
            Ir para o Feed
          </button>
          
          <button 
            className="button button--secondary"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Specific guard for missions
 */
export function MissionGuard({ children }) {
  return (
    <SocialModeGuard moduleName="módulo de missões">
      {children}
    </SocialModeGuard>
  );
}

/**
 * Specific guard for quizzes
 */
export function QuizGuard({ children }) {
  return (
    <SocialModeGuard moduleName="módulo de quizzes">
      {children}
    </SocialModeGuard>
  );
}

/**
 * Specific guard for badges
 */
export function BadgeGuard({ children }) {
  return (
    <SocialModeGuard moduleName="módulo de badges">
      {children}
    </SocialModeGuard>
  );
}

/**
 * Specific guard for ranking
 */
export function RankingGuard({ children }) {
  return (
    <SocialModeGuard moduleName="ranking">
      {children}
    </SocialModeGuard>
  );
}

// Helper function to get display names for features
function getFeatureDisplayName(feature) {
  const displayNames = {
    feed: '📱 Publicar no feed',
    comments: '💬 Comentar e responder',
    likes: '❤️ Curtir posts',
    qr: '📷 Escanear QR codes'
  };
  
  return displayNames[feature] || feature;
}

export default SocialModeGuard;
