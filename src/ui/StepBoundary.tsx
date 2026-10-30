/**
 * Görev K20: sihirbaz adımı hata sınırı. Adım çökerse sayfa beyazlamaz; "Bu adımda bir sorun oluştu" mesajı gösterilir,
 * hata ayrıntısı (bağlam, mesaj, stack) konsola ve hata günlüğüne (Durum ekranı) yazılır.
 */
import { Component, type ReactNode } from 'react';
import { t } from '../i18n';
import { logError } from './errorLog';

export class StepBoundary extends Component<{ where: string; context: Record<string, unknown>; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) {
    logError({ where: this.props.where, message: error.message, stack: error.stack, context: this.props.context });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const W = t().builder.wiz;
    return (
      <div className="step-crash" role="alert">
        <p><b>{W.stepCrash}</b></p>
        <p className="mute">{this.state.error.message}</p>
      </div>
    );
  }
}
