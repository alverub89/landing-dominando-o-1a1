/**
 * Admin Event Settings Component with Social Mode Warning
 * 
 * Shows clear warning when social mode is activated by disabling ranking.
 * 
 * @module components/admin/EventSettings
 */

import React, { useState, useEffect } from 'react';
import './EventSettings.css';

/**
 * Event configuration form for admin panel
 */
export function EventSettings({ eventId, initialSettings, onSave }) {
  const [rankingEnabled, setRankingEnabled] = useState(initialSettings?.features?.ranking ?? true);
  const [missionsEnabled, setMissionsEnabled] = useState(initialSettings?.features?.missions ?? true);
  const [quizzesEnabled, setQuizzesEnabled] = useState(initialSettings?.features?.quizzes ?? true);
  const [badgesEnabled, setBadgesEnabled] = useState(initialSettings?.features?.badges ?? true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  const isSocialMode = !rankingEnabled;
  
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const features = {
        ranking: rankingEnabled,
        missions: missionsEnabled,
        quizzes: quizzesEnabled,
        badges: badgesEnabled,
        feed: true,
        comments: true,
        likes: true,
        qr: true
      };
      
      const response = await fetch(`/api/admin/events/${eventId}/features`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSaveMessage({
          type: 'success',
          text: data.message || 'Configurações salvas com sucesso!'
        });
        
        if (onSave) {
          onSave(data.features);
        }
      } else {
        throw new Error(data.error || 'Erro ao salvar');
      }
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="event-settings">
      <div className="event-settings__header">
        <h2>Configurações do Evento</h2>
        <p className="event-settings__subtitle">
          Configure as funcionalidades disponíveis neste evento
        </p>
      </div>
      
      <div className="event-settings__section">
        <h3>Modo do Evento</h3>
        
        <div className="setting-group setting-group--primary">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={rankingEnabled}
              onChange={(e) => setRankingEnabled(e.target.checked)}
              className="setting-checkbox"
            />
            <div className="setting-content">
              <div className="setting-title">Ativar Competição/Ranking</div>
              <div className="setting-description">
                Habilita competição entre participantes com pontuação e ranking
              </div>
            </div>
          </label>
        </div>
        
        {/* Social Mode Warning */}
        {isSocialMode && (
          <div className="warning-message warning-message--social-mode">
            <div className="warning-message__icon">⚠️</div>
            <div className="warning-message__content">
              <div className="warning-message__title">
                <strong>Modo Social Ativo</strong>
              </div>
              <div className="warning-message__text">
                <p>
                  Com a competição desligada, missões, quizzes e badges 
                  serão automaticamente desativados.
                </p>
                <p>
                  O evento ficará focado em interações sociais: 
                  feed, comentários, curtidas e QR codes.
                </p>
              </div>
              <div className="warning-message__features">
                <div className="feature-status">
                  <span className="feature-status__label">Disponíveis:</span>
                  <span className="feature-status__items">
                    Feed, Comentários, Curtidas, QR Codes
                  </span>
                </div>
                <div className="feature-status feature-status--disabled">
                  <span className="feature-status__label">Desativados:</span>
                  <span className="feature-status__items">
                    Missões, Quizzes, Badges, Ranking
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Competition Mode Info */}
        {!isSocialMode && (
          <div className="info-message">
            <div className="info-message__icon">ℹ️</div>
            <div className="info-message__content">
              <strong>Modo Competição Ativo</strong>
              <p>Configure abaixo quais funcionalidades de gamificação deseja ativar.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Gamification Settings - Only visible in competition mode */}
      {!isSocialMode && (
        <div className="event-settings__section">
          <h3>Funcionalidades de Gamificação</h3>
          <p className="section-description">
            Escolha quais funcionalidades de gamificação estarão disponíveis
          </p>
          
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={missionsEnabled}
                onChange={(e) => setMissionsEnabled(e.target.checked)}
                className="setting-checkbox"
              />
              <div className="setting-content">
                <div className="setting-title">Missões</div>
                <div className="setting-description">
                  Desafios e tarefas para os participantes completarem
                </div>
              </div>
            </label>
          </div>
          
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={quizzesEnabled}
                onChange={(e) => setQuizzesEnabled(e.target.checked)}
                className="setting-checkbox"
              />
              <div className="setting-content">
                <div className="setting-title">Quizzes</div>
                <div className="setting-description">
                  Perguntas e respostas para testar conhecimentos
                </div>
              </div>
            </label>
          </div>
          
          <div className="setting-group">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={badgesEnabled}
                onChange={(e) => setBadgesEnabled(e.target.checked)}
                className="setting-checkbox"
              />
              <div className="setting-content">
                <div className="setting-title">Badges</div>
                <div className="setting-description">
                  Conquistas e medalhas por completar desafios
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
      
      {/* Social Features - Always available */}
      <div className="event-settings__section">
        <h3>Funcionalidades Sociais</h3>
        <p className="section-description">
          Estas funcionalidades estão sempre ativas
        </p>
        
        <div className="features-list features-list--readonly">
          <div className="feature-item feature-item--active">
            <span className="feature-item__icon">📱</span>
            <span className="feature-item__name">Feed de Posts</span>
          </div>
          <div className="feature-item feature-item--active">
            <span className="feature-item__icon">💬</span>
            <span className="feature-item__name">Comentários</span>
          </div>
          <div className="feature-item feature-item--active">
            <span className="feature-item__icon">❤️</span>
            <span className="feature-item__name">Curtidas</span>
          </div>
          <div className="feature-item feature-item--active">
            <span className="feature-item__icon">📷</span>
            <span className="feature-item__name">QR Codes</span>
          </div>
        </div>
      </div>
      
      {/* Save Message */}
      {saveMessage && (
        <div className={`save-message save-message--${saveMessage.type}`}>
          {saveMessage.text}
        </div>
      )}
      
      {/* Save Button */}
      <div className="event-settings__actions">
        <button 
          className="button button--primary button--large"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}

export default EventSettings;
