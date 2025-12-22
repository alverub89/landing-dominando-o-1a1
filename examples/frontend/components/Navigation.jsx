/**
 * Navigation Component with Social Mode Support
 * 
 * Shows/hides navigation items based on social mode and feature flags.
 * 
 * @module components/Navigation
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFeatures, useSocialMode, useFeature } from '../contexts/FeatureContext';
import './Navigation.css';

/**
 * Main navigation component
 */
export function Navigation() {
  const { features, loading } = useFeatures();
  const isSocialMode = useSocialMode();
  
  // Individual feature checks
  const hasMissions = useFeature('missions');
  const hasQuizzes = useFeature('quizzes');
  const hasBadges = useFeature('badges');
  const hasRanking = useFeature('ranking');
  
  if (loading) {
    return (
      <nav className="navigation navigation--loading">
        <div className="navigation__skeleton">Carregando...</div>
      </nav>
    );
  }
  
  return (
    <nav className="navigation">
      {/* Show mode indicator */}
      {isSocialMode && (
        <div className="navigation__mode-badge">
          Modo Social
        </div>
      )}
      
      <ul className="navigation__list">
        {/* Always visible: Feed */}
        <li className="navigation__item">
          <NavLink 
            to="/feed" 
            className={({ isActive }) => 
              isActive ? 'navigation__link navigation__link--active' : 'navigation__link'
            }
          >
            <span className="navigation__icon">📱</span>
            <span className="navigation__label">Feed</span>
          </NavLink>
        </li>
        
        {/* Only in competition mode: Missions */}
        {hasMissions && (
          <li className="navigation__item">
            <NavLink 
              to="/missions" 
              className={({ isActive }) => 
                isActive ? 'navigation__link navigation__link--active' : 'navigation__link'
              }
            >
              <span className="navigation__icon">🎯</span>
              <span className="navigation__label">Missões</span>
            </NavLink>
          </li>
        )}
        
        {/* Only in competition mode: Quizzes */}
        {hasQuizzes && (
          <li className="navigation__item">
            <NavLink 
              to="/quizzes" 
              className={({ isActive }) => 
                isActive ? 'navigation__link navigation__link--active' : 'navigation__link'
              }
            >
              <span className="navigation__icon">❓</span>
              <span className="navigation__label">Quizzes</span>
            </NavLink>
          </li>
        )}
        
        {/* Only in competition mode: Badges */}
        {hasBadges && (
          <li className="navigation__item">
            <NavLink 
              to="/badges" 
              className={({ isActive }) => 
                isActive ? 'navigation__link navigation__link--active' : 'navigation__link'
              }
            >
              <span className="navigation__icon">🏆</span>
              <span className="navigation__label">Badges</span>
            </NavLink>
          </li>
        )}
        
        {/* Only in competition mode: Ranking */}
        {hasRanking && (
          <li className="navigation__item">
            <NavLink 
              to="/ranking" 
              className={({ isActive }) => 
                isActive ? 'navigation__link navigation__link--active' : 'navigation__link'
              }
            >
              <span className="navigation__icon">📊</span>
              <span className="navigation__label">Ranking</span>
            </NavLink>
          </li>
        )}
        
        {/* Always visible: QR Code */}
        <li className="navigation__item">
          <NavLink 
            to="/qr" 
            className={({ isActive }) => 
              isActive ? 'navigation__link navigation__link--active' : 'navigation__link'
            }
          >
            <span className="navigation__icon">📷</span>
            <span className="navigation__label">QR Code</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

/**
 * Mobile bottom navigation
 */
export function BottomNavigation() {
  const isSocialMode = useSocialMode();
  const hasMissions = useFeature('missions');
  const hasRanking = useFeature('ranking');
  
  return (
    <nav className="bottom-navigation">
      <NavLink to="/feed" className="bottom-navigation__item">
        <span className="bottom-navigation__icon">📱</span>
        <span className="bottom-navigation__label">Feed</span>
      </NavLink>
      
      {hasMissions && (
        <NavLink to="/missions" className="bottom-navigation__item">
          <span className="bottom-navigation__icon">🎯</span>
          <span className="bottom-navigation__label">Missões</span>
        </NavLink>
      )}
      
      {hasRanking && (
        <NavLink to="/ranking" className="bottom-navigation__item">
          <span className="bottom-navigation__icon">📊</span>
          <span className="bottom-navigation__label">Ranking</span>
        </NavLink>
      )}
      
      <NavLink to="/qr" className="bottom-navigation__item">
        <span className="bottom-navigation__icon">📷</span>
        <span className="bottom-navigation__label">QR</span>
      </NavLink>
    </nav>
  );
}

export default Navigation;
