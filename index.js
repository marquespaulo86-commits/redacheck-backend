<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RedaCheck — Avaliação Inteligente de Redações</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF9F7; min-height: 100vh; display: flex; justify-content: center; }
.app { max-width: 480px; width: 100%; min-height: 100vh; background: #FAF9F7; }
.screen { display: none; }
.screen.active { display: block; }
.header { background: #FAF9F7; border-bottom: 1px solid #EEEBE6; padding: 14px 20px 12px; text-align: center; position: sticky; top: 0; z-index: 10; }
.logo { font-size: 20px; font-weight: 600; color: #1A1A1A; letter-spacing: 3px; }
.logo span { color: #C96A3A; }
.tagline { font-size: 10px; color: #9B9080; letter-spacing: 1.5px; margin-top: 2px; text-transform: uppercase; }
.greeting-small { font-size: 12px; color: #6B6255; margin-top: 5px; display: none; }
.bonus-chip { display: none; align-items: center; gap: 5px; background: #F0FDF4; color: #16A34A; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; margin-top: 5px; justify-content: center; border: 1px solid #BBF7D0; }
/* Barra de usuário no header */
.user-header-bar { display: none; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #EEEBE6; }
.user-header-nome { font-size: 12px; font-weight: 600; color: #1A1A1A; }
.user-header-codigo { font-size: 10px; color: #9B9080; letter-spacing: 0.5px; margin-top: 1px; }
.user-header-credito { display: flex; align-items: center; gap: 5px; background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 20px; padding: 4px 10px; cursor: pointer; transition: background 0.15s; }
.user-header-credito:hover { background: #FEF3EC; border-color: #F9D4BE; }
.user-header-credito-label { font-size: 10px; color: #9B9080; }
.user-header-credito-valor { font-size: 11px; font-weight: 700; color: #16A34A; }
/* Extrato */
.extrato-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F5F2EE; }
.extrato-item:last-child { border-bottom: none; }
.extrato-icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px; }
.extrato-icon.entrada { background: #F0FDF4; }
.extrato-icon.saida { background: #FFF7ED; }
.extrato-icon i { font-size: 15px; }
.extrato-icon.entrada i { color: #16A34A; }
.extrato-icon.saida i { color: #EA580C; }
.extrato-desc { flex: 1; }
.extrato-desc-title { font-size: 13px; font-weight: 500; color: #1A1A1A; }
.extrato-desc-date { font-size: 11px; color: #9B9080; margin-top: 2px; }
.extrato-valor { font-size: 13px; font-weight: 700; }
.extrato-valor.entrada { color: #16A34A; }
.extrato-valor.saida { color: #EA580C; }
.extrato-saldo-total { background: #1A1A1A; border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
.extrato-indicacao-barra { background: #FEF3EC; border: 1px solid #F9D4BE; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
.extrato-indicacao-progress { height: 6px; background: #E5E0D8; border-radius: 3px; margin-top: 8px; overflow: hidden; }
.extrato-indicacao-fill { height: 100%; background: #C96A3A; border-radius: 3px; transition: width 0.4s; }
.nav { display: flex; border-bottom: 1px solid #EEEBE6; background: #FAF9F7; }
.nav-tab { flex: 1; padding: 11px 8px; text-align: center; font-size: 11px; cursor: pointer; letter-spacing: 0.5px; color: #9B9080; border-bottom: 2px solid transparent; transition: all 0.15s; text-transform: uppercase; font-weight: 500; }
.nav-tab.active { color: #C96A3A; border-bottom-color: #C96A3A; }
.body { padding: 24px 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #1A1A1A; margin-bottom: 6px; }
.page-sub { font-size: 13px; color: #6B6255; margin-bottom: 20px; line-height: 1.6; }
.field-label { display: block; font-size: 11px; font-weight: 600; color: #6B6255; margin-bottom: 5px; letter-spacing: 0.5px; text-transform: uppercase; }
input, select, textarea { width: 100%; padding: 11px 13px; border: 1px solid #E5E0D8; border-radius: 10px; font-size: 14px; color: #1A1A1A; margin-bottom: 14px; outline: none; background: #FFFFFF; transition: border-color 0.15s; font-family: inherit; }
input:focus, select:focus, textarea:focus { border-color: #C96A3A; box-shadow: 0 0 0 3px rgba(201,106,58,0.1); }
textarea { height: 150px; resize: vertical; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-primary { width: 100%; padding: 13px; background: #1A1A1A; color: #FAF9F7; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.15s; font-family: inherit; }
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { width: 100%; padding: 12px; background: transparent; color: #1A1A1A; border: 1px solid #E5E0D8; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; margin-top: 8px; transition: background 0.15s; font-family: inherit; }
.btn-secondary:hover { background: #F5F2EE; }
.btn-ghost { width: 100%; padding: 10px; background: transparent; color: #9B9080; border: none; font-size: 13px; cursor: pointer; margin-top: 4px; font-family: inherit; }
.home-hero { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
.home-badge { display: inline-block; background: #FEF3EC; color: #C96A3A; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px; border: 1px solid #F9D4BE; }
.home-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 10px; line-height: 1.4; }
.home-text { font-size: 13px; color: #6B6255; line-height: 1.7; }
.bonus-banner { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
.bonus-title { font-size: 14px; font-weight: 600; color: #16A34A; margin-bottom: 2px; }
.bonus-sub { font-size: 12px; color: #16A34A; opacity: 0.85; line-height: 1.5; }
.divider { border: none; border-top: 1px solid #EEEBE6; margin: 18px 0; }
.sec-label { font-size: 11px; font-weight: 600; color: #9B9080; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px; }
.process-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.process-item { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 12px; padding: 12px 14px; }
.process-name { font-size: 13px; font-weight: 600; color: #1A1A1A; }
.process-desc { font-size: 11px; color: #9B9080; margin-top: 3px; }
.feature-item { display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start; }
.feature-icon { width: 36px; height: 36px; border-radius: 10px; background: #FEF3EC; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.feature-icon i { font-size: 18px; color: #C96A3A; }
.feature-title { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 3px; }
.feature-sub { font-size: 12px; color: #6B6255; line-height: 1.5; }
.lgpd-box { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 12px; padding: 13px 14px; margin-bottom: 14px; }
.lgpd-title { font-size: 11px; font-weight: 600; color: #6B6255; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.lgpd-text { font-size: 12px; color: #6B6255; line-height: 1.7; }
.menor-box { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; display: none; }
.menor-title { font-size: 11px; font-weight: 600; color: #92400E; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.menor-text { font-size: 12px; color: #92400E; line-height: 1.6; }
.checkbox-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
.checkbox-row input[type=checkbox] { width: 16px; height: 16px; min-width: 16px; margin-top: 1px; accent-color: #C96A3A; cursor: pointer; }
.checkbox-label { font-size: 12px; color: #6B6255; line-height: 1.6; }
.checkbox-label a { color: #C96A3A; text-decoration: none; }
.privacy-note { font-size: 11px; color: #9B9080; text-align: center; margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 5px; }
.welcome-name { font-size: 24px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
.welcome-subtitle { font-size: 17px; color: #C96A3A; font-weight: 600; margin-bottom: 20px; font-style: italic; }
.welcome-quote { background: #FEF3EC; border-left: 3px solid #C96A3A; border-radius: 0 12px 12px 0; padding: 13px 15px; font-size: 13px; font-style: italic; color: #8B4513; margin-bottom: 16px; line-height: 1.7; }
.welcome-text { font-size: 13px; color: #6B6255; line-height: 1.8; margin-bottom: 14px; }
.welcome-closing { font-size: 15px; font-weight: 600; color: #1A1A1A; text-align: center; margin: 20px 0 6px; }
.perfil-progress { display: flex; gap: 6px; margin-bottom: 24px; }
.perfil-step { flex: 1; height: 4px; border-radius: 2px; background: #E5E0D8; transition: background 0.3s; }
.perfil-step.done { background: #C96A3A; }
.perfil-step.active { background: #F9D4BE; }
.perfil-question { font-size: 16px; font-weight: 600; color: #1A1A1A; margin-bottom: 6px; line-height: 1.4; }
.perfil-hint { font-size: 12px; color: #9B9080; margin-bottom: 16px; line-height: 1.5; }
.option-list { margin-bottom: 16px; }
.option-item { border: 1px solid #E5E0D8; border-radius: 12px; padding: 13px 15px; cursor: pointer; background: #FFFFFF; margin-bottom: 8px; transition: all 0.15s; display: flex; align-items: center; gap: 12px; }
.option-item:hover { border-color: #F9D4BE; background: #FEF3EC; }
.option-item.selected { border: 2px solid #C96A3A; background: #FEF3EC; }
.option-item i { font-size: 20px; color: #9B9080; flex-shrink: 0; }
.option-item.selected i { color: #C96A3A; }
.option-item-text { font-size: 14px; font-weight: 500; color: #1A1A1A; }
.option-item.selected .option-item-text { color: #C96A3A; }
.option-item-sub { font-size: 12px; color: #9B9080; margin-top: 2px; }
.option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
.option-card { padding: 13px 10px; border: 1px solid #E5E0D8; border-radius: 12px; cursor: pointer; background: #FFFFFF; transition: all 0.15s; text-align: center; }
.option-card:hover { border-color: #F9D4BE; background: #FEF3EC; }
.option-card.selected { border: 2px solid #C96A3A; background: #FEF3EC; }
.option-card-text { font-size: 13px; font-weight: 600; color: #1A1A1A; }
.option-card.selected .option-card-text { color: #C96A3A; }
.option-card-sub { font-size: 11px; color: #9B9080; margin-top: 3px; }
.perfilok-icon { width: 72px; height: 72px; border-radius: 50%; background: #FEF3EC; display: flex; align-items: center; justify-content: center; margin: 40px auto 16px; }
.perfilok-icon i { font-size: 36px; color: #C96A3A; }
.dashboard { min-height: 100vh; background: #FAF9F7; }
.dash-hero { padding: 48px 24px 32px; text-align: center; }
.dash-asterisk { font-size: 52px; color: #C96A3A; margin-bottom: 16px; display: block; }
.dash-greeting { font-size: 28px; font-weight: 500; color: #1A1A1A; margin-bottom: 8px; letter-spacing: -0.5px; }
.dash-sub { font-size: 14px; color: #9B9080; }
.dash-bonus { display: none; align-items: center; gap: 6px; background: #F0FDF4; color: #16A34A; font-size: 12px; font-weight: 500; padding: 5px 14px; border-radius: 20px; margin-top: 12px; border: 1px solid #BBF7D0; justify-content: center; }
.dash-input-area { padding: 0 20px 24px; }
.dash-input-box { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 16px; padding: 16px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; }
.dash-input-placeholder { font-size: 14px; color: #9B9080; margin-bottom: 16px; }
.dash-input-actions { display: flex; justify-content: space-between; align-items: center; }
.dash-input-btn { display: flex; align-items: center; gap: 5px; padding: 7px 12px; border: 1px solid #E5E0D8; border-radius: 20px; font-size: 12px; color: #6B6255; cursor: pointer; background: #FAF9F7; font-family: inherit; }
.dash-input-btn i { font-size: 14px; color: #C96A3A; }
.dash-send { width: 36px; height: 36px; background: #E5E0D8; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; }
.dash-send:hover { background: #1A1A1A; }
.dash-send:hover i { color: white; }
.dash-send i { font-size: 16px; color: #9B9080; }
.dash-shortcuts { padding: 0 20px 24px; }
.dash-shortcut-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dash-shortcut { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 14px; padding: 16px 14px; cursor: pointer; transition: all 0.15s; }
.dash-shortcut:hover { border-color: #C96A3A; background: #FEF3EC; }
.dash-shortcut i { font-size: 22px; color: #C96A3A; margin-bottom: 8px; display: block; }
.dash-shortcut-title { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 3px; }
.dash-shortcut-sub { font-size: 11px; color: #9B9080; line-height: 1.4; }
.dash-recent { padding: 0 20px 32px; }
.dash-recent-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 12px; margin-bottom: 8px; cursor: pointer; transition: background 0.15s; }
.dash-recent-item:hover { background: #F5F2EE; }
.dash-recent-score { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.dash-recent-score.high { background: #F0FDF4; color: #16A34A; }
.dash-recent-score.mid { background: #FEF3EC; color: #C96A3A; }
.dash-recent-score.low { background: #FFF7ED; color: #EA580C; }
.dash-recent-tema { font-size: 13px; font-weight: 500; color: #1A1A1A; margin-bottom: 2px; }
.dash-recent-meta { font-size: 11px; color: #9B9080; }
.dash-evol { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 12px; padding: 14px 16px; text-align: center; margin-top: 4px; }
.dash-evol-label { font-size: 11px; color: #9B9080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
.dash-evol-num { font-size: 22px; font-weight: 700; color: #1A1A1A; }
.dash-evol-delta { font-size: 12px; color: #16A34A; margin-top: 3px; font-weight: 500; }
.mode-row { display: flex; gap: 8px; margin-bottom: 14px; }
.mode-btn { flex: 1; padding: 10px 6px; text-align: center; border: 1px solid #E5E0D8; border-radius: 10px; cursor: pointer; font-size: 12px; color: #6B6255; background: #FFFFFF; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 5px; font-family: inherit; font-weight: 500; }
.mode-btn.selected { border: 2px solid #C96A3A; color: #C96A3A; font-weight: 600; background: #FEF3EC; }
.upload-area { border: 1.5px dashed #D5CFC7; border-radius: 14px; padding: 30px 16px; text-align: center; cursor: pointer; margin-bottom: 14px; background: #F5F2EE; }
.upload-area i { font-size: 36px; color: #9B9080; margin-bottom: 10px; display: block; }
.upload-title { font-size: 15px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
.upload-sub { font-size: 12px; color: #9B9080; line-height: 1.5; }
.badge-row { margin-top: 12px; }
.fmt-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin: 2px; background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
.pay-card { border: 1px solid #E5E0D8; border-radius: 12px; padding: 13px 15px; cursor: pointer; background: #FFFFFF; margin-bottom: 8px; transition: all 0.15s; display: flex; align-items: center; gap: 12px; }
.pay-card.selected { border: 2px solid #C96A3A; background: #FEF3EC; }
.pay-card i { font-size: 22px; color: #9B9080; width: 28px; text-align: center; }
.pay-card.selected i { color: #C96A3A; }
.pay-name { font-size: 14px; font-weight: 600; color: #1A1A1A; }
.pay-desc { font-size: 11px; color: #9B9080; margin-top: 1px; }
.pay-price { margin-left: auto; font-size: 15px; font-weight: 700; color: #16A34A; }
.processing-view { text-align: center; padding: 56px 20px; }
.proc-icon { font-size: 48px; color: #C96A3A; animation: spin 2s linear infinite; display: block; margin-bottom: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.progress-track { width: 200px; height: 4px; background: #E5E0D8; border-radius: 2px; margin: 24px auto 0; overflow: hidden; }
.progress-bar { height: 100%; width: 0; background: #C96A3A; border-radius: 2px; animation: prog 2.8s ease-in-out forwards; }
@keyframes prog { to { width: 100%; } }
.score-card { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px; }
.score-label-top { font-size: 12px; color: #9B9080; margin-bottom: 6px; font-weight: 500; }
.score-number { font-size: 52px; font-weight: 700; color: #1A1A1A; line-height: 1; margin-bottom: 8px; }
.score-nivel { display: inline-block; background: #F0FDF4; color: #16A34A; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; border: 1px solid #BBF7D0; }
.comp-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #EEEBE6; }
.comp-label { font-size: 12px; color: #1A1A1A; flex: 1; }
.comp-bar { width: 64px; height: 6px; background: #E5E0D8; border-radius: 3px; overflow: hidden; margin: 0 10px; }
.comp-fill { height: 100%; border-radius: 3px; }
.comp-val { font-size: 12px; font-weight: 600; color: #1A1A1A; min-width: 50px; text-align: right; }
.result-block { border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; border-left: 3px solid; }
.result-block.green { border-left-color: #16A34A; background: #F0FDF4; border-top: 1px solid #BBF7D0; border-right: 1px solid #BBF7D0; border-bottom: 1px solid #BBF7D0; }
.result-block.orange { border-left-color: #C96A3A; background: #FEF3EC; border-top: 1px solid #F9D4BE; border-right: 1px solid #F9D4BE; border-bottom: 1px solid #F9D4BE; }
.result-block.yellow { border-left-color: #CA8A04; background: #FEFCE8; border-top: 1px solid #FEF08A; border-right: 1px solid #FEF08A; border-bottom: 1px solid #FEF08A; }
.result-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 5px; }
.result-tag.green { color: #16A34A; }
.result-tag.orange { color: #C96A3A; }
.result-tag.yellow { color: #CA8A04; }
.result-text { font-size: 13px; color: #1A1A1A; line-height: 1.6; }
.result-ref { font-size: 11px; color: #9B9080; margin-top: 5px; font-style: italic; display: flex; align-items: center; gap: 5px; }
.result-ref a { color: #C96A3A; text-decoration: none; }
.result-ref a:hover { text-decoration: underline; }
.philosophy-block { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 14px; padding: 16px; margin: 16px 0; }
.philo-title { font-size: 11px; font-weight: 700; color: #9B9080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.philo-text { font-size: 13px; color: #1A1A1A; line-height: 1.8; }
.philo-quote { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 10px; padding: 12px 14px; margin-top: 12px; font-size: 13px; font-style: italic; color: #6B6255; text-align: center; }

/* ── PLANO PROFESSOR ─────────────────────────────────────────── */
.plano-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.plano-card { border: 2px solid #E5E0D8; border-radius: 16px; padding: 16px; cursor: pointer; transition: all 0.2s; background: #FFFFFF; text-align: center; }
.plano-card:hover { border-color: #C96A3A; background: #FEF3EC; }
.plano-card.selected { border-color: #C96A3A; background: #FEF3EC; }
.plano-card-icon { font-size: 28px; margin-bottom: 8px; }
.plano-card-nome { font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 4px; }
.plano-card-preco { font-size: 18px; font-weight: 800; color: #C96A3A; margin-bottom: 4px; }
.plano-card-preco span { font-size: 11px; font-weight: 500; color: #9B9080; }
.plano-card-desc { font-size: 11px; color: #6B6255; line-height: 1.5; }
.plano-card-badge { display: inline-block; background: #C96A3A; color: white; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.plano-beneficios { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; }
.plano-beneficio { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #1A1A1A; line-height: 1.5; }
.plano-beneficio:last-child { margin-bottom: 0; }
.plano-beneficio i { color: #16A34A; font-size: 14px; flex-shrink: 0; margin-top: 1px; }

/* Upload CND */
.upload-cnd-area { border: 2px dashed #E5E0D8; border-radius: 14px; padding: 28px 20px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 14px; background: #FAFAF8; }
.upload-cnd-area:hover { border-color: #C96A3A; background: #FEF3EC; }
.upload-cnd-area.has-file { border-color: #16A34A; background: #F0FDF4; }
.upload-cnd-icon { font-size: 32px; color: #D5CFC7; margin-bottom: 10px; }
.upload-cnd-area.has-file .upload-cnd-icon { color: #16A34A; }
.upload-cnd-titulo { font-size: 14px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
.upload-cnd-sub { font-size: 12px; color: #9B9080; }
.upload-cnd-nome { font-size: 12px; color: #16A34A; font-weight: 600; margin-top: 6px; }

/* Badge professor no dashboard */
.badge-professor { display: inline-flex; align-items: center; gap: 5px; background: #FEF3EC; border: 1px solid #F9D4BE; border-radius: 20px; padding: 4px 11px; font-size: 11px; font-weight: 600; color: #C96A3A; margin-bottom: 8px; }
.badge-professor-pendente { background: #FFF7ED; border-color: #FED7AA; color: #EA580C; }

/* Painel professor no dashboard */
.prof-painel { background: linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%); border-radius: 16px; padding: 18px; margin-bottom: 16px; color: white; }
.prof-painel-titulo { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); margin-bottom: 10px; }
.prof-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.prof-stat { text-align: center; }
.prof-stat-val { font-size: 22px; font-weight: 700; color: #FAF9F7; }
.prof-stat-label { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }
.prof-barra-container { margin-top: 12px; }
.prof-barra-label { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 5px; }
.prof-barra { height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.prof-barra-fill { height: 100%; background: #C96A3A; border-radius: 3px; transition: width 0.4s; }

/* Alunos vinculados */
.aluno-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 10px; margin-bottom: 6px; }
.aluno-codigo { font-size: 13px; font-weight: 700; color: #C96A3A; letter-spacing: 1px; }
.aluno-data { font-size: 11px; color: #9B9080; }
.aluno-remover { background: none; border: none; color: #D5CFC7; cursor: pointer; font-size: 16px; padding: 0; }
.aluno-remover:hover { color: #EA580C; }

/* Vincular aluno */
.vincular-box { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 12px; padding: 14px; margin-bottom: 16px; }
.vincular-row { display: flex; gap: 8px; }
.vincular-row input { margin-bottom: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
.vincular-btn { padding: 11px 16px; background: #1A1A1A; color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; transition: opacity 0.15s; }
.vincular-btn:hover { opacity: 0.8; }
.feedback-block { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 14px; padding: 16px; margin: 16px 0; }
.stars { display: flex; gap: 8px; margin-bottom: 12px; }
.star { font-size: 26px; cursor: pointer; color: #E5E0D8; transition: color 0.1s; }
.star.active { color: #C96A3A; }
.feedback-reply { background: #FEF3EC; border: 1px solid #F9D4BE; border-radius: 10px; padding: 12px 14px; margin-top: 10px; display: none; }
.feedback-reply-text { font-size: 12px; color: #8B4513; line-height: 1.6; }
.history-item { border: 1px solid #E5E0D8; border-radius: 12px; padding: 13px 15px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; cursor: pointer; background: #FFFFFF; transition: background 0.15s; }
.history-item:hover { background: #F5F2EE; }
.hist-score { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.hist-score.high { background: #F0FDF4; color: #16A34A; }
.hist-score.mid { background: #FEF3EC; color: #C96A3A; }
.hist-score.low { background: #FFF7ED; color: #EA580C; }
.hist-tema { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 3px; }
.hist-meta { font-size: 11px; color: #9B9080; }
/* Código do usuário */
.user-code-box { background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
.user-code-label { font-size: 10px; color: #9B9080; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
.user-code-value { font-size: 15px; font-weight: 700; color: #C96A3A; letter-spacing: 2px; }
.user-code-copy { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 8px; padding: 6px 10px; font-size: 11px; color: #6B6255; cursor: pointer; font-family: inherit; }
/* Sistema de créditos */
.credito-saldo { background: linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%); border-radius: 16px; padding: 20px; margin-bottom: 20px; color: white; text-align: center; }
.credito-saldo-label { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.credito-saldo-valor { font-size: 36px; font-weight: 700; color: #FAF9F7; margin-bottom: 4px; }
.credito-saldo-sub { font-size: 12px; color: rgba(255,255,255,0.5); }
.credito-tabela { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 14px; overflow: hidden; margin-bottom: 20px; }
.credito-tabela-header { background: #F5F2EE; padding: 10px 16px; font-size: 11px; font-weight: 600; color: #9B9080; text-transform: uppercase; letter-spacing: 0.5px; }
.credito-linha { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #F5F2EE; }
.credito-linha:last-child { border-bottom: none; }
.credito-faixa { font-size: 13px; color: #1A1A1A; font-weight: 500; }
.credito-preco { font-size: 13px; font-weight: 700; color: #16A34A; }
.credito-economia { font-size: 11px; color: #9B9080; margin-top: 1px; }
.credito-destaque { background: #FEF3EC; border-left: 3px solid #C96A3A; }
.deposito-input-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 14px; }
.deposito-input-row input { margin-bottom: 0; flex: 1; }
/* Análise por parágrafo */
.paragrafo-block { background: #FFFFFF; border: 1px solid #E5E0D8; border-radius: 14px; margin-bottom: 12px; overflow: hidden; }
.paragrafo-header { background: #F5F2EE; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.paragrafo-titulo { font-size: 12px; font-weight: 700; color: #1A1A1A; text-transform: uppercase; letter-spacing: 0.5px; }
.paragrafo-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.paragrafo-badge.bom { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
.paragrafo-badge.regular { background: #FEF3EC; color: #C96A3A; border: 1px solid #F9D4BE; }
.paragrafo-badge.atencao { background: #FEFCE8; color: #CA8A04; border: 1px solid #FEF08A; }
.paragrafo-body { padding: 14px; display: none; }
.paragrafo-body.open { display: block; }
.paragrafo-texto { font-size: 12px; color: #6B6255; line-height: 1.7; margin-bottom: 10px; font-style: italic; border-left: 2px solid #E5E0D8; padding-left: 10px; }
.paragrafo-analise { font-size: 13px; color: #1A1A1A; line-height: 1.7; margin-bottom: 8px; }
.paragrafo-link { font-size: 11px; color: #C96A3A; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; }
.paragrafo-link:hover { text-decoration: underline; }
/* Comentário geral */
.comentario-geral { background: #1A1A1A; border-radius: 14px; padding: 18px; margin: 16px 0; color: white; }
.comentario-geral-titulo { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
.comentario-geral-text { font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.8; margin-bottom: 12px; }
.comentario-geral-assinatura { font-size: 11px; color: rgba(255,255,255,0.4); font-style: italic; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
/* Indicação */
.indicacao-box { background: #FEF3EC; border: 1px solid #F9D4BE; border-radius: 14px; padding: 16px; margin-bottom: 16px; }
.indicacao-titulo { font-size: 13px; font-weight: 700; color: #C96A3A; margin-bottom: 6px; }
.indicacao-sub { font-size: 12px; color: #8B4513; line-height: 1.6; }
/* Crédito no dashboard — sutil, canto esquerdo */
.dash-credito { display: inline-flex; align-items: center; gap: 8px; background: transparent; padding: 0 20px 0; margin-bottom: 20px; }
.dash-credito-inner { display: flex; align-items: center; gap: 6px; background: #F5F2EE; border: 1px solid #E5E0D8; border-radius: 20px; padding: 5px 12px; }
.dash-credito-label { font-size: 10px; color: #9B9080; font-weight: 500; }
.dash-credito-valor { font-size: 12px; font-weight: 700; color: #16A34A; }
.dash-credito-btn { font-size: 10px; color: #C96A3A; font-weight: 600; cursor: pointer; background: none; border: none; font-family: inherit; padding: 0; }
</style>
  <!-- SDK Mercado Pago Bricks -->
  <script src="https://sdk.mercadopago.com/js/v2"></script>
</head>
<body>
<div class="app">
  <div class="header">
    <div class="logo">REDA<span>CHECK</span></div>
    <div class="tagline">mais que corrigir — aperfeiçoar</div>
    <div class="user-header-bar" id="user-header-bar">
      <div>
        <div class="user-header-nome" id="user-header-nome"></div>
        <div class="user-header-codigo" id="user-header-codigo"></div>
      </div>
      <div class="user-header-credito" onclick="goTo('extrato')">
        <i class="ti ti-wallet" style="font-size:12px;color:#9B9080"></i>
        <span class="user-header-credito-label">Créditos</span>
        <span class="user-header-credito-valor" id="user-header-saldo">R$ 0,00</span>
      </div>
    </div>
    <div id="bonus-chip" class="bonus-chip"><i class="ti ti-gift"></i> 1 redação bônus disponível</div>
  </div>
  <div class="nav" id="nav">
    <div class="nav-tab active" onclick="goTo('home')">Início</div>
    <div class="nav-tab" onclick="goTo('login')">Entrar</div>
  </div>

  <!-- HOME -->
  <div class="screen active" id="screen-home">
    <div class="body">
      <div class="home-hero" style="text-align:center">
        <div class="home-badge" style="display:block;text-align:center;font-size:12px;letter-spacing:1px">UMA PLATAFORMA PEDAGÓGICA INOVADORA</div>
        <div class="home-title" style="text-align:center">A avaliação de redações que ensina enquanto corrige</div>
        <div class="home-text" style="text-align:center">Critérios oficiais do ENEM, FUVEST, ITA, UNICAMP e concursos públicos — fundamentada nos melhores linguistas e gramáticos do Português Brasileiro.</div>
      </div>
      <div class="bonus-banner"><div><i class="ti ti-gift" style="font-size:26px;color:#16A34A"></i></div><div><div class="bonus-title">1 redação bônus ao criar conta</div><div class="bonus-sub">Experimente gratuitamente na primeira avaliação.</div></div></div>
      <!-- EQUIPE REDA -->
      <div style="background:#1A1A1A;border-radius:16px;padding:18px 20px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;background:#C96A3A;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="ti ti-users" style="font-size:16px;color:white"></i>
          </div>
          <div style="font-size:13px;font-weight:700;color:#FAF9F7;letter-spacing:1px">EQUIPE REDA</div>
        </div>
        <p style="font-size:13px;color:rgba(255,255,255,0.78);line-height:1.8;margin-bottom:10px">
          O RedaCheck é desenvolvido por um time diversificado de profissionais de altíssimo nível nas áreas de <strong style="color:#F9D4BE">Letras, Computação, Línguas Estrangeiras, Recursos Humanos e Administração</strong>.
        </p>
        <p style="font-size:13px;color:rgba(255,255,255,0.78);line-height:1.8;margin-bottom:10px">
          Nossa missão é oferecer uma plataforma educacional moderna e compatível com as demandas reais de alunos da Educação Básica, universitários, concurseiros e professores.
        </p>
        <p style="font-size:13px;color:#C96A3A;font-weight:600;font-style:italic;line-height:1.6">
          "Nossa meta é levar você a uma verdadeira viagem de conhecimento e crescimento acadêmico-profissional!"
        </p>
      </div>
      <div class="sec-label" style="font-size:12px;letter-spacing:0.5px;text-align:center">AVALIAÇÃO COM BASE NOS MELHORES VESTIBULARES E CONCURSOS DO BRASIL</div>

      <div class="divider"></div>
      <div class="sec-label" style="font-size:12px;letter-spacing:0.5px">AQUI VOCÊ TERÁ UMA EXPERIÊNCIA INCRÍVEL COM:</div>
      <div class="feature-item"><div class="feature-icon"><i class="ti ti-file-check"></i></div><div><div class="feature-title">Avaliação completa em segundos</div><div class="feature-sub">Nota com análise das 5 competências do ENEM e capacidade argumentativa.</div></div></div>
      <div class="feature-item"><div class="feature-icon"><i class="ti ti-camera"></i></div><div><div class="feature-title">Aceita redação manuscrita</div><div class="feature-sub">Foto de folha escrita à mão, conforme é realizado em todas as provas.</div></div></div>
      <div class="feature-item"><div class="feature-icon"><i class="ti ti-list-search"></i></div><div><div class="feature-title">Análise parágrafo por parágrafo</div><div class="feature-sub">Cada parágrafo analisado individualmente: coesão, coerência e argumentação.</div></div></div>
      <div class="feature-item"><div class="feature-icon"><i class="ti ti-report"></i></div><div><div class="feature-title">PDF + página interativa</div><div class="feature-sub">Marcações visuais com legendas e hiperlinks com explicações das correções.</div></div></div>
      <div class="feature-item"><div class="feature-icon"><i class="ti ti-chart-line"></i></div><div><div class="feature-title">Histórico de evolução</div><div class="feature-sub">Acompanhe seu crescimento redação por redação e veja seu progresso real.</div></div></div>
      <div class="feature-item"><div class="feature-icon"><i class="ti ti-coin"></i></div><div><div class="feature-title">Sistema de créditos com desconto</div><div class="feature-sub">Deposite créditos e pague menos por redação. Quanto mais você deposita, maior o desconto.</div></div></div>
      <button class="btn-primary" onclick="goTo('cadastro')">Criar conta e ganhar redação bônus <i class="ti ti-arrow-right"></i></button>
      <button class="btn-secondary" onclick="goTo('login')">Já tenho conta — entrar</button>
    </div>
  </div>

  <!-- RECUPERAÇÃO DE SENHA — PASSO 1: SOLICITAR CÓDIGO -->
  <div class="screen" id="screen-recuperar">
    <div class="body">
      <div style="text-align:center;padding-top:20px">
        <div style="width:72px;height:72px;background:#FEF3EC;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <i class="ti ti-lock-open" style="font-size:32px;color:#C96A3A"></i>
        </div>
        <div class="page-title" style="text-align:center">Recuperar senha</div>
        <div class="page-sub" style="text-align:center">Digite seu e-mail cadastrado e enviaremos um código para redefinir sua senha.</div>
      </div>
      <label class="field-label">E-mail cadastrado</label>
      <input type="email" id="recuperar-email" placeholder="seu@email.com">
      <button class="btn-primary" onclick="solicitarRecuperacao()">Enviar código <i class="ti ti-send"></i></button>
      <button class="btn-ghost" onclick="goTo('login')"><i class="ti ti-arrow-left"></i> Voltar ao login</button>
    </div>
  </div>

  <!-- RECUPERAÇÃO DE SENHA — PASSO 2: NOVO CÓDIGO + NOVA SENHA -->
  <div class="screen" id="screen-nova-senha">
    <div class="body">
      <div style="text-align:center;padding-top:20px">
        <div style="width:72px;height:72px;background:#FEF3EC;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <i class="ti ti-key" style="font-size:32px;color:#C96A3A"></i>
        </div>
        <div class="page-title" style="text-align:center">Nova senha</div>
        <div class="page-sub" style="text-align:center">Insira o código enviado para<br><strong id="nova-senha-email-display"></strong></div>
      </div>
      <label class="field-label">Código de verificação</label>
      <input type="text" id="nova-senha-codigo" placeholder="000000" maxlength="6"
        style="text-align:center;font-size:24px;font-weight:700;letter-spacing:6px"
        oninput="this.value=this.value.replace(/\D/g,'')">
      <label class="field-label">Nova senha</label>
      <input type="password" id="nova-senha-input" placeholder="Mínimo 6 caracteres">
      <label class="field-label">Confirmar nova senha</label>
      <input type="password" id="nova-senha-confirmar" placeholder="Repita a nova senha">
      <button class="btn-primary" onclick="redefinirSenha()">Redefinir senha <i class="ti ti-check"></i></button>
      <button class="btn-ghost" onclick="solicitarRecuperacao(true)"><i class="ti ti-refresh"></i> Reenviar código</button>
      <button class="btn-ghost" onclick="goTo('login')"><i class="ti ti-arrow-left"></i> Voltar ao login</button>
    </div>
  </div>

  <!-- CONFIRMAÇÃO DE E-MAIL -->
  <div class="screen" id="screen-confirmar">
    <div class="body">
      <div style="text-align:center;padding-top:20px">
        <div style="width:72px;height:72px;background:#FEF3EC;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <i class="ti ti-mail" style="font-size:32px;color:#C96A3A"></i>
        </div>
        <div class="page-title" style="text-align:center">Confirme seu e-mail</div>
        <div class="page-sub" style="text-align:center">Enviamos um código de 6 dígitos para<br><strong id="confirmar-email-display"></strong></div>
      </div>
      <div style="margin:24px 0">
        <label class="field-label">Código de confirmação</label>
        <input type="text" id="confirmar-codigo" placeholder="000000" maxlength="6"
          style="text-align:center;font-size:28px;font-weight:700;letter-spacing:8px"
          oninput="this.value=this.value.replace(/\D/g,'')"
          onkeydown="if(event.key==='Enter')confirmarEmail()">
      </div>
      <button class="btn-primary" onclick="confirmarEmail()">Confirmar e-mail <i class="ti ti-check"></i></button>
      <button class="btn-ghost" onclick="reenviarCodigo()"><i class="ti ti-refresh"></i> Reenviar código</button>
      <div style="font-size:12px;color:#9B9080;text-align:center;margin-top:12px">
        O código é válido por 15 minutos.
      </div>
    </div>
  </div>

  <!-- CADASTRO -->
  <div class="screen" id="screen-cadastro">
    <div class="body">
      <div class="page-title">Criar conta</div>
      <div class="page-sub">Preencha seus dados e ganhe 1 redação bônus gratuita.</div>
      <div class="bonus-banner" style="margin-bottom:16px"><div><i class="ti ti-gift" style="font-size:24px;color:#16A34A"></i></div><div><div class="bonus-title">Sua 1ª redação é gratuita</div><div class="bonus-sub">Experimente sem compromisso.</div></div></div>
      <label class="field-label">Nome completo</label><input type="text" id="cad-nome" placeholder="Seu nome completo">
      <label class="field-label">E-mail</label><input type="email" id="cad-email" placeholder="seu@email.com" autocomplete="off">
      <label class="field-label">Senha</label><input type="password" id="cad-senha" placeholder="Mínimo 6 caracteres" autocomplete="off">
      <label class="field-label">WhatsApp <span style="font-size:11px;color:#9B9080;font-weight:400">(opcional — usado para promoções e suporte)</span></label>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:14px;color:#6B6255;font-weight:600;padding:12px 8px;background:#F5F0EB;border-radius:10px;white-space:nowrap">🇧🇷 +55</span>
        <input type="tel" id="cad-whatsapp" placeholder="(DDD) 9 0000-0000" style="flex:1"
          oninput="this.value=this.value.replace(/\D/g,'').replace(/(\d{2})(\d{1})(\d{4})(\d{4})/,'($1) $2 $3-$4').substring(0,16)">
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:4px;margin-bottom:8px">
        <input type="checkbox" id="check-whatsapp-mkt" style="margin-top:3px;width:16px;height:16px;flex-shrink:0">
        <label for="check-whatsapp-mkt" style="font-size:11px;color:#9B9080;line-height:1.5;cursor:pointer">
          Aceito receber promoções, novidades e dicas de redação via WhatsApp. (opcional — LGPD art. 7º, IX)
        </label>
      </div>
      <div class="row2">
        <div><label class="field-label">Nascimento</label><input type="date" id="cad-nasc" onchange="verificarIdade(this.value)"></div>
        <div><label class="field-label">Ano escolar</label><select id="cad-ano"><option value="">Selecione</option><option>1º ano EM</option><option>2º ano EM</option><option>3º ano EM</option><option>Pré-vestibular</option><option>Ensino Superior</option><option>Concurseiro</option><option>Professor</option></select></div>
      </div>
      <div class="menor-box" id="menor-box"><div class="menor-title"><i class="ti ti-alert-triangle"></i> Usuário menor de idade</div><div class="menor-text">De acordo com a <strong><a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" style="color:#92400E">LGPD (Lei 13.709/2018)</a></strong> e o <strong><a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm" target="_blank" style="color:#92400E">Marco Civil da Internet (Lei 12.965/2014)</a></strong>, o cadastro de menores requer autorização dos responsáveis legais.</div></div>
      <label class="field-label">Tipo de instituição</label><select id="cad-escola"><option value="">Selecione</option><option>Escola Pública</option><option>Escola Privada</option><option>Cursinho / Pré-Vestibular</option><option>Universidade / Faculdade</option><option>Escola Técnica / IFET</option><option>Outro</option></select>

      <label class="field-label">Você é professor?</label>
      <div style="display:flex;gap:12px;margin-bottom:14px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 16px;border:1.5px solid #E5E0D8;border-radius:10px;flex:1;font-size:13px;font-weight:600;color:#1A1A1A" id="label-prof-nao">
          <input type="radio" name="cad-professor" id="cad-prof-nao" value="nao" checked onchange="toggleCND(false)" style="width:16px;height:16px"> Não sou professor
        </label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:10px 16px;border:1.5px solid #E5E0D8;border-radius:10px;flex:1;font-size:13px;font-weight:600;color:#1A1A1A" id="label-prof-sim">
          <input type="radio" name="cad-professor" id="cad-prof-sim" value="sim" onchange="toggleCND(true)" style="width:16px;height:16px"> Sou professor
        </label>
      </div>

      <div id="cnd-box" style="display:none;background:#FEF3EC;border:1.5px solid #F9D4BE;border-left:4px solid #C96A3A;border-radius:12px;padding:14px 16px;margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;color:#C96A3A;margin-bottom:8px"><i class="ti ti-id-badge"></i> Comprovação de Vínculo Docente</div>
        <div style="font-size:12px;color:#6B6255;margin-bottom:10px;line-height:1.6">Envie um dos documentos abaixo para verificação. Após aprovação, você receberá <strong>50% de desconto</strong> em cada avaliação (R$2,45).</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#6B6255"><i class="ti ti-check" style="color:#C96A3A;font-size:13px"></i> <strong>CND</strong> — Carteira Nacional Docente (MEC)</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#6B6255"><i class="ti ti-check" style="color:#C96A3A;font-size:13px"></i> <strong>Declaração institucional</strong> com assinatura digital do responsável</div>
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#6B6255"><i class="ti ti-check" style="color:#C96A3A;font-size:13px"></i> <strong>Contracheque</strong> que comprove vínculo docente ativo</div>
        </div>
        <div class="upload-area" id="upload-cnd-area" onclick="document.getElementById('cnd-file').click()" style="padding:14px">
          <i class="ti ti-file-certificate" style="font-size:24px"></i>
          <div class="upload-title" style="font-size:13px">Clique para enviar o documento</div>
          <div class="upload-sub">JPG, PNG ou PDF — máx. 5MB</div>
        </div>
        <input type="file" id="cnd-file" accept="image/*,.pdf" style="display:none" onchange="cndSelecionado(this)">
        <div id="cnd-preview" style="display:none;margin-top:8px;font-size:12px;color:#16A34A;font-weight:600"></div>
        <div style="font-size:11px;color:#9B9080;margin-top:8px;font-style:italic">O desconto será ativado após verificação manual pela equipe RedaCheck (até 48h úteis).</div>
      </div>
      <div style="background:#FEF3EC;border:1px solid #F9D4BE;border-radius:12px;padding:12px 14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:600;color:#C96A3A;margin-bottom:6px;display:flex;align-items:center;gap:6px"><i class="ti ti-share" style="font-size:13px"></i> Você foi indicado por alguém?</div>
        <div style="font-size:12px;color:#8B4513;margin-bottom:8px">Se alguém te indicou o RedaCheck, insira o código abaixo. Isso ajuda quem te indicou a ganhar benefícios!</div>
        <input type="text" id="cad-indicacao" placeholder="Ex: RC-2026-04872" style="margin-bottom:0;text-transform:uppercase;letter-spacing:1px">
      </div>
      <div class="divider"></div>
      <div class="sec-label">Termos e condições</div>
      <div class="lgpd-box"><div class="lgpd-title"><i class="ti ti-shield-check"></i> Proteção de dados — LGPD</div><div class="lgpd-text">Seus dados são tratados exclusivamente para fins educacionais, conforme a <strong><a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" target="_blank" style="color:#6B6255">Lei 13.709/2018</a></strong>.</div></div>
      <div class="lgpd-box"><div class="lgpd-title"><i class="ti ti-file-description"></i> Uso responsável</div><div class="lgpd-text">Plataforma de <strong>uso exclusivamente educacional</strong>. O envio de conteúdo inverídico resultará no <strong>cancelamento imediato do cadastro</strong>, conforme o <strong><a href="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm" target="_blank" style="color:#6B6255">Marco Civil da Internet</a></strong>.</div></div>
      <div class="checkbox-row"><input type="checkbox" id="check-termos"><label class="checkbox-label" for="check-termos">Li e concordo com os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a>.</label></div>
      <div class="checkbox-row"><input type="checkbox" id="check-lgpd"><label class="checkbox-label" for="check-lgpd">Estou ciente de que o envio de conteúdo inadequado resultará no cancelamento do meu cadastro.</label></div>
      <div class="checkbox-row" id="check-menor-row" style="display:none"><input type="checkbox" id="check-menor"><label class="checkbox-label" for="check-menor">Sou responsável legal pelo menor e autorizo o uso educacional desta plataforma.</label></div>
      <button class="btn-primary" onclick="cadastrar()">Criar conta <i class="ti ti-arrow-right"></i></button>
      <button class="btn-secondary" onclick="goTo('login')">Já tenho conta</button>
      <button class="btn-ghost" onclick="goTo('home')"><i class="ti ti-arrow-left"></i> Voltar</button>
      <div class="privacy-note"><i class="ti ti-lock" style="font-size:13px"></i> Seus dados estão protegidos — LGPD art. 14</div>
    </div>
  </div>

  <!-- LOGIN -->
  <div class="screen" id="screen-login">
    <div class="body">
      <div class="page-title" style="text-align:center">Bem-vindo de volta!</div>
      <div class="page-sub" style="text-align:center;font-style:italic">Entre para continuar sua jornada de aquisição de conhecimento e aperfeiçoamento da escrita.</div>
      <label class="field-label">E-mail</label><input type="email" id="login-email" placeholder="seu@email.com" autocomplete="off" onkeydown="if(event.key==='Enter')login()">
      <label class="field-label">Senha</label><input type="password" id="login-senha" placeholder="••••••••" autocomplete="off" onkeydown="if(event.key==='Enter')login()">
      <div style="text-align:right;margin-top:-8px;margin-bottom:14px"><span style="font-size:12px;color:#C96A3A;cursor:pointer" onclick="goTo('recuperar')">Esqueci minha senha</span></div>
      <button class="btn-primary" onclick="login()">Entrar <i class="ti ti-arrow-right"></i></button>
      <button class="btn-secondary" onclick="goTo('cadastro')">Criar conta grátis</button>
      <button class="btn-ghost" onclick="goTo('home')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <!-- BOAS-VINDAS -->
  <div class="screen" id="screen-boasvindas">
    <div class="body">
      <div class="welcome-name" id="welcome-name"></div>
      <div class="welcome-subtitle" style="text-align:center">Seja muito bem-vindo ao RedaCheck!</div>
      <div class="welcome-quote" style="text-align:center;border-left:none;border-radius:12px">Mais que corrigir, queremos que você amplie seus conhecimentos e aperfeiçoe sua capacidade de escrita!</div>
      <div class="welcome-text">É com imensa satisfação que disponibilizamos uma ferramenta que vai além da mera análise de textos. O RedaCheck avalia redações com o rigor dos critérios oficiais dos vestibulares mais relevantes do país e dos concursos públicos mais concorridos.</div>
      <div class="welcome-text">Nossa metodologia está fundamentada nos melhores <strong>gramáticos</strong>, <strong>sociolinguistas</strong>, <strong>linguistas</strong> e pesquisadores do <strong>Português Brasileiro</strong> — como <strong>Evanildo Bechara</strong> (autor da <em>Moderna Gramática Portuguesa</em>), <strong>Irandé Antunes</strong> (autora de <em>Muito Além da Gramática</em>, UFPE) e <strong>Mário Perini</strong> (autor da <em>Gramática Descritiva do Português</em>, UFMG). Não será uma simples correção gramatical — e sim uma verdadeira aula dos recursos coesivos e da coerência contida em cada redação analisada.</div>
      <div class="welcome-text">Acreditamos que não existem manuais com formatos prontos de escrita. A escrita é um processo que se aperfeiçoa pela prática, pelo domínio do conhecimento das estruturas da língua e pela capacidade crítica de leitura de cada escritor.</div>
      <div class="welcome-text">Convidamos você a investir no seu crescimento acadêmico. A partir das correções de suas redações, sua prática de escrita construirá um caminho de aprovações e conquistas que transformarão sua história.</div>
      <div class="welcome-closing">Venha e aproveite um espaço que, acima de tudo, foi pensado para você!</div>
      <button class="btn-primary" style="margin-top:24px" onclick="goTo('perfil1')">Vamos lá! <i class="ti ti-arrow-right"></i></button>
    </div>
  </div>

  <!-- PERFIL 1-5 -->
  <div class="screen" id="screen-perfil1">
    <div class="body">
      <div class="perfil-progress"><div class="perfil-step done"></div><div class="perfil-step active"></div><div class="perfil-step"></div><div class="perfil-step"></div><div class="perfil-step"></div><div class="perfil-step"></div></div>
      <div class="perfil-question">Qual é o seu principal objetivo?</div>
      <div class="perfil-hint">Isso personaliza sua experiência.</div>
      <div class="option-list">
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-pencil"></i><div><div class="option-item-text">Passar no ENEM</div><div class="option-item-sub">Nota acima de 800</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-school"></i><div><div class="option-item-text">Vestibular específico</div><div class="option-item-sub">FUVEST, ITA, UNICAMP ou outra</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-building"></i><div><div class="option-item-text">Concurso público</div><div class="option-item-sub">Federal, estadual ou municipal</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-writing"></i><div><div class="option-item-text">Melhorar minha escrita</div><div class="option-item-sub">Desenvolvimento pessoal</div></div></div>
      </div>
      <button class="btn-primary" onclick="goTo('perfil2')">Continuar <i class="ti ti-arrow-right"></i></button>
      <button class="btn-ghost" onclick="goTo('boasvindas')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <div class="screen" id="screen-perfil2">
    <div class="body">
      <div class="perfil-progress"><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step active"></div><div class="perfil-step"></div><div class="perfil-step"></div><div class="perfil-step"></div></div>
      <div class="perfil-question">Qual prova é sua prioridade?</div>
      <div class="perfil-hint">Usaremos os critérios oficiais desta prova.</div>
      <div class="option-grid">
        <div class="option-card" onclick="selCard(this);userBanca='ENEM'"><div class="option-card-text">ENEM</div><div class="option-card-sub">Nota 0–1000</div></div>
        <div class="option-card" onclick="selCard(this);userBanca='FUVEST'"><div class="option-card-text">FUVEST/USP</div><div class="option-card-sub">Nota 0–10</div></div>
        <div class="option-card" onclick="selCard(this);userBanca='ITA'"><div class="option-card-text">ITA</div><div class="option-card-sub">Nota 0–100</div></div>
        <div class="option-card" onclick="selCard(this);userBanca='UNICAMP'"><div class="option-card-text">UNICAMP</div><div class="option-card-sub">Nota 0–12</div></div>
        <div class="option-card" onclick="selCard(this);userBanca='CONCURSO_PUBLICO'" style="grid-column:1/-1;max-width:50%;margin:0 auto"><div class="option-card-text">Concurso público</div><div class="option-card-sub">Edital específico</div></div>
      </div>
      <button class="btn-primary" onclick="goTo('perfil3')">Continuar <i class="ti ti-arrow-right"></i></button>
      <button class="btn-ghost" onclick="goTo('perfil1')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <div class="screen" id="screen-perfil3">
    <div class="body">
      <div class="perfil-progress"><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step active"></div><div class="perfil-step"></div><div class="perfil-step"></div></div>
      <div class="perfil-question">Quando pretende fazer a prova?</div>
      <div class="option-list">
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-calendar-event"></i><div><div class="option-item-text">Neste ano</div><div class="option-item-sub">Nos próximos meses</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-calendar"></i><div><div class="option-item-text">No próximo ano</div><div class="option-item-sub">Tenho tempo para me preparar</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-clock"></i><div><div class="option-item-text">Ainda não sei</div><div class="option-item-sub">Preparação sem data definida</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-check"></i><div><div class="option-item-text">Já fiz a prova</div><div class="option-item-sub">Quero melhorar para tentar novamente</div></div></div>
      </div>
      <button class="btn-primary" onclick="goTo('perfil4')">Continuar <i class="ti ti-arrow-right"></i></button>
      <button class="btn-ghost" onclick="goTo('perfil2')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <div class="screen" id="screen-perfil4">
    <div class="body">
      <div class="perfil-progress"><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step active"></div><div class="perfil-step"></div></div>
      <div class="perfil-question">Qual foi sua nota na última redação?</div>
      <div class="option-list">
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-chart-bar"></i><div><div class="option-item-text">Abaixo de 400</div><div class="option-item-sub">Ainda desenvolvendo a base</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-chart-bar"></i><div><div class="option-item-text">Entre 400 e 600</div><div class="option-item-sub">Nível em desenvolvimento</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-chart-bar"></i><div><div class="option-item-text">Entre 600 e 800</div><div class="option-item-sub">Nível intermediário</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-chart-bar"></i><div><div class="option-item-text">Acima de 800</div><div class="option-item-sub">Nível avançado</div></div></div>
        <div class="option-item" onclick="selOption(this)"><i class="ti ti-minus"></i><div><div class="option-item-text">Não sei / Nunca fiz</div><div class="option-item-sub">Primeira experiência</div></div></div>
      </div>
      <button class="btn-primary" onclick="goTo('perfil5')">Continuar <i class="ti ti-arrow-right"></i></button>
      <button class="btn-ghost" onclick="goTo('perfil3')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <div class="screen" id="screen-perfil5">
    <div class="body">
      <div class="perfil-progress"><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step done"></div><div class="perfil-step active"></div></div>
      <div class="perfil-question">Com que frequência pratica redação?</div>
      <div class="option-grid" style="margin-bottom:20px">
        <div class="option-card" onclick="selCard(this,'freq')"><div class="option-card-text">Diariamente</div></div>
        <div class="option-card" onclick="selCard(this,'freq')"><div class="option-card-text">Semanalmente</div></div>
        <div class="option-card" onclick="selCard(this,'freq')"><div class="option-card-text">Raramente</div></div>
        <div class="option-card" onclick="selCard(this,'freq')"><div class="option-card-text">Nunca pratiquei</div></div>
      </div>
      <div class="perfil-question">Maior dificuldade na escrita?</div>
      <div class="perfil-hint">Pode marcar mais de uma.</div>
      <div class="option-grid" style="margin-bottom:20px">
        <div class="option-card" onclick="toggleCard(this)"><div class="option-card-text">Argumentação</div></div>
        <div class="option-card" onclick="toggleCard(this)"><div class="option-card-text">Coesão</div></div>
        <div class="option-card" onclick="toggleCard(this)"><div class="option-card-text">Intervenção</div></div>
        <div class="option-card" onclick="toggleCard(this)"><div class="option-card-text">Norma culta</div></div>
        <div class="option-card" onclick="toggleCard(this)"><div class="option-card-text">Introdução</div></div>
        <div class="option-card" onclick="toggleCard(this)"><div class="option-card-text">Tudo</div></div>
      </div>
      <div class="perfil-question">Hábito de leitura?</div>
      <div class="option-grid">
        <div class="option-card" onclick="selCard(this,'leit')"><div class="option-card-text">Sim, diariamente</div></div>
        <div class="option-card" onclick="selCard(this,'leit')"><div class="option-card-text">Às vezes</div></div>
        <div class="option-card" onclick="selCard(this,'leit')"><div class="option-card-text">Raramente</div></div>
        <div class="option-card" onclick="selCard(this,'leit')"><div class="option-card-text">Quero começar</div></div>
      </div>
      <button class="btn-primary" style="margin-top:6px" onclick="goTo('planos')">Continuar <i class="ti ti-arrow-right"></i></button>
      <button class="btn-ghost" onclick="goTo('perfil4')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <div class="screen" id="screen-perfilok">
    <div class="body" style="text-align:center;padding-top:40px">
      <div class="perfilok-icon"><i class="ti ti-check"></i></div>
      <div style="font-size:20px;font-weight:700;color:#1A1A1A;margin-bottom:8px">Perfil criado!</div>
      <div style="font-size:13px;color:#6B6255;line-height:1.7;margin-bottom:16px">Ótimo, <span id="perfil-nome"></span>!<br>Suas avaliações serão personalizadas.<br><br>Sua <strong>redação bônus</strong> está esperando!</div>
      <div class="user-code-box" style="max-width:280px;margin:0 auto 20px">
        <div><div class="user-code-label">Seu código RedaCheck</div><div class="user-code-value" id="user-code-display"></div></div>
        <button class="user-code-copy" onclick="copiarCodigo()"><i class="ti ti-copy"></i> Copiar</button>
      </div>
      <div style="font-size:12px;color:#9B9080;margin-bottom:20px">Use este código para indicar amigos e ganhar redações bônus!</div>
      <button class="btn-primary" id="btn-perfilok" style="max-width:300px;margin:0 auto">Começar <i class="ti ti-arrow-right"></i></button>
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       TELA — ESCOLHA DO PLANO
       ══════════════════════════════════════════ -->
  <div class="screen" id="screen-planos">
    <div class="body">
      <div class="page-title">Escolha seu plano</div>
      <div class="page-sub">Selecione a modalidade que melhor se encaixa no seu perfil.</div>

      <div class="plano-cards">
        <!-- PLANO ALUNO -->
        <div class="plano-card selected" id="plano-aluno" onclick="selecionarPlano('aluno')">
          <div class="plano-card-icon">🎓</div>
          <div class="plano-card-nome">Aluno</div>
          <div class="plano-card-preco">R$ 4,90 <span>/ redação</span></div>
          <div class="plano-card-desc">Pay-per-use. Descontos progressivos por depósito.</div>
        </div>
        <!-- PLANO PROFESSOR -->
        <div class="plano-card" id="plano-professor" onclick="selecionarPlano('professor')">
          <div class="plano-card-badge">Popular</div>
          <div class="plano-card-icon">📚</div>
          <div class="plano-card-nome">Professor</div>
          <div class="plano-card-preco">R$ 39 <span>/ mês</span></div>
          <div class="plano-card-desc">100 redações + alunos vinculados ilimitados.</div>
        </div>
      </div>

      <!-- Benefícios professor -->
      <div id="beneficios-professor" style="display:none">
        <div class="plano-beneficios">
          <div class="plano-beneficio"><i class="ti ti-check"></i> <strong>100 avaliações/mês</strong> — renova todo dia 1º</div>
          <div class="plano-beneficio"><i class="ti ti-check"></i> Alunos vinculados via código — acesso livre para eles avaliarem pelo seu plano</div>
          <div class="plano-beneficio"><i class="ti ti-check"></i> Painel do professor com histórico de todos os alunos</div>
          <div class="plano-beneficio"><i class="ti ti-check"></i> Critérios de todas as bancas: ENEM, ITA, Unicamp, Fuvest, Concurso</div>
          <div class="plano-beneficio"><i class="ti ti-check"></i> Verificação via Carteira Nacional Docente (CND)</div>
        </div>
        <div style="background:#FEF3EC;border:1px solid #F9D4BE;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#8B4513">
          <strong>Como funciona a vinculação?</strong> Você repassa seu código de professor para o aluno. Ele insere o código na plataforma e passa a usar o seu saldo de 100 redações/mês.
        </div>
      </div>

      <button class="btn-primary" onclick="avancarPlano()">Continuar <i class="ti ti-arrow-right"></i></button>
      <button class="btn-ghost" onclick="goTo('perfil5')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       TELA — CADASTRO PROFESSOR (Upload CND)
       ══════════════════════════════════════════ -->
  <div class="screen" id="screen-professor-cadastro">
    <div class="body">
      <div class="page-title">Cadastro Professor</div>
      <div class="page-sub">Verificamos sua identidade docente pela Carteira Nacional Docente (CND) emitida pelo MEC. Processo seguro e rápido.</div>

      <label class="field-label">Nível de ensino em que leciona</label>
      <select id="prof-nivel" style="margin-bottom:14px">
        <option value="">Selecione...</option>
        <option>Ensino Fundamental I</option>
        <option>Ensino Fundamental II</option>
        <option>Ensino Médio</option>
        <option>Pré-vestibular / Cursinho</option>
        <option>Ensino Superior</option>
        <option>Educação de Jovens e Adultos (EJA)</option>
        <option>Outro</option>
      </select>

      <label class="field-label">Disciplina(s) que leciona</label>
      <input type="text" id="prof-disciplina" placeholder="Ex: Língua Portuguesa, Redação, Literatura...">

      <label class="field-label">Instituição de ensino</label>
      <input type="text" id="prof-instituicao" placeholder="Nome da escola ou universidade">

      <label class="field-label">Tipo de documento</label>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border:1.5px solid #E5E0D8;border-radius:10px;font-size:13px;color:#1A1A1A">
          <input type="radio" name="tipo-doc" value="CND" checked style="width:16px;height:16px"> <strong>CND</strong> — Carteira Nacional Docente (MEC)
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border:1.5px solid #E5E0D8;border-radius:10px;font-size:13px;color:#1A1A1A">
          <input type="radio" name="tipo-doc" value="Declaração" style="width:16px;height:16px"> <strong>Declaração institucional</strong> com assinatura digital
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 14px;border:1.5px solid #E5E0D8;border-radius:10px;font-size:13px;color:#1A1A1A">
          <input type="radio" name="tipo-doc" value="Contracheque" style="width:16px;height:16px"> <strong>Contracheque</strong> com vínculo docente ativo
        </label>
      </div>
      <label class="field-label">Envio do documento</label>
      <div class="upload-cnd-area" id="upload-area" onclick="document.getElementById('cnd-file').click()">
        <div class="upload-cnd-icon"><i class="ti ti-id-badge-2"></i></div>
        <div class="upload-cnd-titulo">Toque para enviar a CND</div>
        <div class="upload-cnd-sub">Frente do documento • JPG, PNG ou PDF • máx. 5MB</div>
        <div class="upload-cnd-nome" id="cnd-nome" style="display:none"></div>
      </div>
      <input type="file" id="cnd-file" accept="image/*,.pdf" style="display:none" onchange="cndSelecionado(this)">

      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92400E">
        <i class="ti ti-info-circle" style="font-size:13px;margin-right:4px"></i>
        <strong>Análise em até 24h úteis.</strong> Você receberá uma notificação quando sua conta for ativada. Enquanto isso, pode usar o plano Aluno normalmente.
      </div>

      <label class="field-label">Forma de pagamento — R$ 39,00/mês</label>
      <div class="pay-card selected" onclick="selPag(this,'prof-pix')"><i class="ti ti-qrcode"></i><div><div class="pay-name">Pix</div><div class="pay-desc">Aprovação imediata</div></div></div>
      <div class="pay-card" onclick="selPag(this,'prof-cartao')"><i class="ti ti-credit-card"></i><div><div class="pay-name">Cartão de crédito</div><div class="pay-desc">Recorrente mensal</div></div></div>

      <button class="btn-primary" onclick="enviarCadastroProfessor()">Enviar para análise <i class="ti ti-send"></i></button>
      <button class="btn-ghost" onclick="goTo('planos')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       TELA — PROFESSOR AGUARDANDO VERIFICAÇÃO
       ══════════════════════════════════════════ -->
  <div class="screen" id="screen-professor-pendente">
    <div class="body" style="text-align:center;padding-top:40px">
      <div style="width:64px;height:64px;background:#FFF7ED;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px">⏳</div>
      <div style="font-size:20px;font-weight:700;color:#1A1A1A;margin-bottom:8px">Solicitação enviada!</div>
      <div style="font-size:13px;color:#6B6255;line-height:1.8;margin-bottom:20px">Sua CND está em análise.<br>Responderemos em <strong>até 24h úteis</strong>.<br><br>Enquanto isso, você já pode usar o RedaCheck normalmente com o plano Aluno.</div>
      <div style="background:#F5F2EE;border:1px solid #E5E0D8;border-radius:12px;padding:14px;margin-bottom:20px;text-align:left">
        <div style="font-size:11px;font-weight:700;color:#9B9080;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Próximos passos</div>
        <div style="font-size:13px;color:#6B6255;line-height:1.8">
          ✓ Solicitação recebida<br>
          ⏳ Verificação da CND pelo operador<br>
          — Ativação do Plano Professor<br>
          — Recebimento do código de professor
        </div>
      </div>
      <button class="btn-primary" onclick="goTo('dashboard')">Ir para o início <i class="ti ti-arrow-right"></i></button>
    </div>
  </div>

  <!-- ══════════════════════════════════════════
       TELA — PAINEL DO PROFESSOR
       ══════════════════════════════════════════ -->
  <div class="screen" id="screen-professor-painel">
    <div class="body">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div class="page-title" style="margin-bottom:0">Painel Professor</div>
        <div id="badge-prof-status" class="badge-professor">✓ Verificado</div>
      </div>

      <!-- Stats -->
      <div class="prof-painel">
        <div class="prof-painel-titulo">Plano Professor — Mês atual</div>
        <div class="prof-stats">
          <div class="prof-stat">
            <div class="prof-stat-val" id="prof-usadas">0</div>
            <div class="prof-stat-label">Usadas</div>
          </div>
          <div class="prof-stat">
            <div class="prof-stat-val" id="prof-restantes">100</div>
            <div class="prof-stat-label">Restantes</div>
          </div>
          <div class="prof-stat">
            <div class="prof-stat-val" id="prof-alunos-count">0</div>
            <div class="prof-stat-label">Alunos</div>
          </div>
        </div>
        <div class="prof-barra-container">
          <div class="prof-barra-label">
            <span>Redações utilizadas</span>
            <span id="prof-barra-pct">0%</span>
          </div>
          <div class="prof-barra"><div class="prof-barra-fill" id="prof-barra-fill" style="width:0%"></div></div>
        </div>
      </div>

      <!-- Código do professor -->
      <div class="user-code-box" style="margin-bottom:16px">
        <div>
          <div class="user-code-label">Seu código de professor</div>
          <div class="user-code-value" id="prof-codigo-display"></div>
          <div style="font-size:11px;color:#9B9080;margin-top:3px">Repasse aos alunos para vinculação</div>
        </div>
        <button class="user-code-copy" onclick="copiarCodigoProfessor()"><i class="ti ti-copy"></i> Copiar</button>
      </div>

      <!-- Vincular alunos -->
      <label class="field-label">Alunos vinculados</label>
      <div class="vincular-box">
        <div style="font-size:12px;color:#6B6255;margin-bottom:8px">O aluno repassa o código abaixo para você, ou você pode inserir manualmente:</div>
        <div class="vincular-row">
          <input type="text" id="vincular-input" placeholder="Código do aluno" style="text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:0" maxlength="8">
          <button class="vincular-btn" onclick="vincularAluno()"><i class="ti ti-user-plus"></i> Vincular</button>
        </div>
      </div>

      <div id="alunos-lista">
        <div style="text-align:center;padding:20px;color:#D5CFC7;font-size:13px">
          <i class="ti ti-users" style="font-size:24px;display:block;margin-bottom:8px"></i>
          Nenhum aluno vinculado ainda.
        </div>
      </div>

      <button class="btn-secondary" onclick="goTo('dashboard')" style="margin-top:16px"><i class="ti ti-home"></i> Voltar ao início</button>
    </div>
  </div>

  <!-- DASHBOARD -->
  <div class="screen" id="screen-dashboard">
    <div class="dashboard">
      <div class="dash-hero">
        <span class="dash-asterisk">✦</span>
        <div class="dash-greeting" id="dash-greeting"></div>
        <div class="dash-sub">O que vamos trabalhar hoje?</div>
        <div class="dash-bonus" id="dash-bonus"><i class="ti ti-gift" style="font-size:13px"></i> 1 redação bônus disponível</div>
      </div>
      <div class="dash-input-area">
        <div class="dash-input-box" onclick="goTo('enviar')">
          <div class="dash-input-placeholder">Enviar nova redação para avaliação...</div>
          <div class="dash-input-actions">
            <div style="display:flex;gap:8px">
              <div class="dash-input-btn"><i class="ti ti-pencil"></i> Digitar</div>
              <div class="dash-input-btn"><i class="ti ti-camera"></i> Foto</div>
              <div class="dash-input-btn"><i class="ti ti-paperclip"></i> Arquivo</div>
            </div>
            <div class="dash-send"><i class="ti ti-arrow-up"></i></div>
          </div>
        </div>
      </div>
      <div class="dash-shortcuts">
        <div class="sec-label" style="margin-bottom:12px">Acesso rápido</div>
        <div class="dash-shortcut-grid">
          <div class="dash-shortcut" onclick="goTo('enviar')"><i class="ti ti-writing"></i><div class="dash-shortcut-title">Nova redação</div><div class="dash-shortcut-sub">Enviar para avaliação</div></div>
          <div class="dash-shortcut" onclick="goTo('hist')"><i class="ti ti-history"></i><div class="dash-shortcut-title">Histórico</div><div class="dash-shortcut-sub">Ver todas as avaliações</div></div>
          <div class="dash-shortcut" onclick="goTo('dicas')"><i class="ti ti-bulb"></i><div class="dash-shortcut-title">Dicas</div><div class="dash-shortcut-sub">Melhorar seu desempenho</div></div>
          <div class="dash-shortcut" onclick="userPlano==='professor'?goTo('professor-painel'):goTo('perfil-view')"><i class="ti ti-user"></i><div class="dash-shortcut-title" id="dash-shortcut-perfil">Meu perfil</div><div class="dash-shortcut-sub" id="dash-shortcut-perfil-sub">Código e indicações</div></div>
        </div>
      </div>
      <div class="dash-recent">
        <div class="sec-label" style="margin-bottom:12px">Últimas avaliações</div>
        <div id="dash-recent-lista">
          <div style="text-align:center;padding:20px 0;color:#9B9080;font-size:13px;color:#D5CFC7">
            <i class="ti ti-history" style="font-size:22px;display:block;margin-bottom:6px"></i>
            Carregando...
          </div>
        </div>
        <div class="dash-evol" id="dash-evol-block" style="display:none"><div class="dash-evol-label">Sua evolução</div><div class="dash-evol-num" id="dash-evol-num">—</div><div class="dash-evol-delta" id="dash-evol-delta"></div></div>
      </div>
    </div>
  </div>

  <!-- ENVIAR REDAÇÃO -->
  <div class="screen" id="screen-enviar">
    <div class="body">
      <div id="bonus-aviso" style="display:none" class="bonus-banner"><div><i class="ti ti-gift" style="font-size:24px;color:#16A34A"></i></div><div><div class="bonus-title">Você tem 1 redação bônus</div><div class="bonus-sub">Esta avaliação é gratuita!</div></div></div>
      <div class="page-title">Nova redação</div>
      <div class="page-sub">Envie sua redação e receba avaliação completa em segundos.</div>
      <label class="field-label">Formato de envio</label>
      <div class="mode-row">
        <div class="mode-btn selected" onclick="selMode(this,'digitar')"><i class="ti ti-pencil"></i> Digitar</div>
        <div class="mode-btn" onclick="selMode(this,'foto')"><i class="ti ti-camera"></i> Foto</div>
        <div class="mode-btn" onclick="selMode(this,'arquivo')"><i class="ti ti-paperclip"></i> Arquivo</div>
      </div>
      <div id="m-digitar"><textarea id="redacao-texto" placeholder="Digite sua redação aqui..."></textarea></div>
      <div id="m-foto" style="display:none">
        <div class="upload-area" onclick="document.getElementById('input-foto').click()">
          <i class="ti ti-camera-up"></i>
          <div class="upload-title">Enviar foto da redação</div>
          <div class="upload-sub">Clique para tirar foto ou escolher da galeria</div>
          <div class="badge-row"><span class="fmt-badge">JPG</span><span class="fmt-badge">PNG</span><span class="fmt-badge">HEIC</span></div>
        </div>
        <input type="file" id="input-foto" accept="image/*" style="display:none" onchange="fotoSelecionada(this)">
        <div id="foto-preview" style="display:none;margin-bottom:12px;text-align:center">
          <img id="foto-img" style="max-width:100%;border-radius:12px;border:1px solid #E5E0D8">
          <div style="font-size:12px;color:#16A34A;margin-top:6px;font-weight:600" id="foto-nome"></div>
        </div>
        <div style="background:#FFFBEB;border:1.5px solid #F9D4BE;border-left:4px solid #C96A3A;border-radius:12px;padding:14px 16px;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><i class="ti ti-camera" style="font-size:18px;color:#C96A3A"></i><span style="font-size:13px;font-weight:700;color:#C96A3A;text-transform:uppercase;letter-spacing:0.5px">Atenção, caro usuário!</span></div>
          <div style="font-size:12px;color:#6B6255;margin-bottom:10px;line-height:1.6">Para uma correção precisa e de qualidade, é fundamental que a foto da sua redação tenha:</div>
          <div style="font-size:12px;color:#1A1A1A;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px"><span style="color:#16A34A;font-weight:700;font-size:14px">✓</span><span>Letra manuscrita legível e bem espaçada</span></div>
          <div style="font-size:12px;color:#1A1A1A;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px"><span style="color:#16A34A;font-weight:700;font-size:14px">✓</span><span>Imagem nítida, sem borrões ou tremidos</span></div>
          <div style="font-size:12px;color:#1A1A1A;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px"><span style="color:#16A34A;font-weight:700;font-size:14px">✓</span><span>Boa iluminação — prefira luz natural</span></div>
          <div style="font-size:12px;color:#1A1A1A;margin-bottom:6px;display:flex;align-items:flex-start;gap:8px"><span style="color:#16A34A;font-weight:700;font-size:14px">✓</span><span>Folha completamente enquadrada nos 4 cantos</span></div>
          <div style="font-size:12px;color:#1A1A1A;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px"><span style="color:#16A34A;font-weight:700;font-size:14px">✓</span><span>Fundo neutro — mesa branca ou bege</span></div>
          <div style="font-size:11px;color:#9B9080;font-style:italic;border-top:1px solid #E5E0D8;padding-top:8px">A qualidade da foto impacta diretamente a qualidade da sua avaliação.</div>
        </div>
      </div>
      <div id="m-arquivo" style="display:none">
        <div class="upload-area" onclick="document.getElementById('input-arquivo').click()">
          <i class="ti ti-file-type-pdf"></i>
          <div class="upload-title">Enviar redação em PDF</div>
          <div class="upload-sub">Clique para selecionar um arquivo PDF</div>
          <div class="badge-row"><span class="fmt-badge">PDF</span></div>
        </div>
        <input type="file" id="input-arquivo" accept=".pdf" style="display:none" onchange="arquivoSelecionado(this)">
        <div id="arquivo-preview" style="display:none;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:10px 14px;margin-bottom:12px">
          <div style="font-size:13px;color:#16A34A;font-weight:600" id="arquivo-nome"></div>
          <div style="font-size:11px;color:#9B9080;margin-top:2px" id="arquivo-tamanho"></div>
        </div>
        <div style="background:#FEF3EC;border-left:4px solid #C96A3A;border-radius:10px;padding:12px 14px;font-size:12px;color:#6B6255;line-height:1.6">
          <strong style="color:#C96A3A">Dica:</strong> Use PDF com texto selecionável (gerado por computador). Para redações manuscritas, use o modo <strong>Foto</strong>.
        </div>
      </div>
      <div id="pagamento-section">
        <label class="field-label" style="margin-top:4px">Pagamento</label>
        <div id="saldo-info" style="display:none;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:10px 14px;margin-bottom:10px;font-size:13px;color:#16A34A;font-weight:500"></div>
        <div class="pay-card selected" onclick="selPag(this,'pix')"><i class="ti ti-qrcode"></i><div><div class="pay-name">Pix</div><div class="pay-desc">Aprovação imediata</div></div><div class="pay-price" id="preco-pix">R$ 4,90</div></div>
        <div class="pay-card" onclick="selPag(this,'cartao')"><i class="ti ti-credit-card"></i><div><div class="pay-name">Cartão</div><div class="pay-desc">Crédito ou débito</div></div><div class="pay-price" id="preco-cartao">R$ 4,90</div></div>
        <div class="pay-card" onclick="selPag(this,'credito')"><i class="ti ti-wallet"></i><div><div class="pay-name">Usar créditos</div><div class="pay-desc" id="pay-credito-desc">Saldo: R$ 0,00</div></div><div class="pay-price" id="preco-credito">R$ 4,90</div></div>
        <div style="margin-top:10px;padding:12px 14px;background:#F5F2EE;border-radius:12px;border:1px solid #E5E0D8">
          <div class="sec-label" style="margin-bottom:8px">Ou deposite créditos com desconto</div>
          <div style="font-size:12px;color:#6B6255;margin-bottom:8px">Deposite R$ 200+ e pague menos por redação.</div>
          <button onclick="goTo('creditos')" style="background:#C96A3A;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Ver planos de crédito →</button>
        </div>
      </div>
      <button class="btn-primary" style="margin-top:14px" id="btn-enviar" onclick="enviar()">Enviar para avaliação <i class="ti ti-arrow-right"></i></button>
    </div>
  </div>

  <!-- PROCESSANDO -->
  <!-- CONFIRMAÇÃO DE SALDO -->
  <div class="screen" id="screen-confirmar-saldo">
    <div class="body" style="padding-top:40px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="width:72px;height:72px;background:#FEF3EC;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <i class="ti ti-coin" style="font-size:32px;color:#C96A3A"></i>
        </div>
        <div class="page-title" style="text-align:center">Confirmar avaliação</div>
      </div>
      <div style="background:#F5F0EB;border-radius:14px;padding:16px;margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:13px;color:#6B6255">Avaliações disponíveis</span>
          <span style="font-size:18px;font-weight:700;color:#1A1A1A" id="confirm-saldo-qtd">0</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:13px;color:#6B6255">Custo desta avaliação</span>
          <span style="font-size:14px;font-weight:600;color:#C96A3A" id="confirm-custo">1 avaliação</span>
        </div>
        <div style="border-top:1px solid #E5E0D8;padding-top:10px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600;color:#1A1A1A">Saldo após avaliação</span>
          <span style="font-size:16px;font-weight:700;color:#16A34A" id="confirm-saldo-restante">0</span>
        </div>
      </div>
      <button class="btn-primary" onclick="confirmarEEnviar()">
        <i class="ti ti-check"></i> Confirmar e avaliar
      </button>
      <button class="btn-ghost" onclick="goTo('enviar')">
        <i class="ti ti-arrow-left"></i> Voltar
      </button>
    </div>
  </div>

  <!-- PROCESSAMENTO -->
  <div class="screen" id="screen-proc">
    <div class="body">
      <div class="processing-view">
        <i class="ti ti-loader-2 proc-icon"></i>
        <div style="font-size:18px;font-weight:700;color:#1A1A1A;margin-bottom:8px">Avaliando sua redação...</div>
        <div style="font-size:13px;color:#9B9080;margin-bottom:6px">Analisando coesão, coerência e competências</div>
        <div style="font-size:12px;color:#C96A3A;font-weight:500">Análise parágrafo por parágrafo em andamento</div>
        <div class="progress-track"><div class="progress-bar"></div></div>
      </div>
    </div>
  </div>

  <!-- RESULTADO -->
  <div class="screen" id="screen-result">
    <div class="body">
      <div class="score-card">
        <div class="score-label-top" id="result-banca-label">ENEM 2025</div>
        <div class="score-number" id="result-nota">720</div>
        <span class="score-nivel" id="result-nivel">Intermediário → Avançado</span>
      </div>
      <label class="field-label">Notas por competência</label>
      <div class="comp-row"><div class="comp-label"><strong>C1</strong> — <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/redacao" target="_blank" style="color:#1A1A1A;text-decoration:none">Norma culta</a></div><div class="comp-bar"><div class="comp-fill" style="width:60%;background:#C96A3A"></div></div><div class="comp-val">120/200</div></div>
      <div class="comp-row"><div class="comp-label"><strong>C2</strong> — Compreensão</div><div class="comp-bar"><div class="comp-fill" style="width:80%;background:#16A34A"></div></div><div class="comp-val">160/200</div></div>
      <div class="comp-row"><div class="comp-label"><strong>C3</strong> — <a href="https://pt.wikipedia.org/wiki/Texto_dissertativo-argumentativo" target="_blank" style="color:#1A1A1A;text-decoration:none">Organização</a></div><div class="comp-bar"><div class="comp-fill" style="width:80%;background:#16A34A"></div></div><div class="comp-val">160/200</div></div>
      <div class="comp-row"><div class="comp-label"><strong>C4</strong> — <a href="https://pt.wikipedia.org/wiki/Capacidade_argumentativa" target="_blank" style="color:#1A1A1A;text-decoration:none">Argumentação</a></div><div class="comp-bar"><div class="comp-fill" style="width:80%;background:#16A34A"></div></div><div class="comp-val">160/200</div></div>
      <div class="comp-row"><div class="comp-label"><strong>C5</strong> — Intervenção</div><div class="comp-bar"><div class="comp-fill" style="width:60%;background:#C96A3A"></div></div><div class="comp-val">120/200</div></div>

      <!-- ANÁLISE POR PARÁGRAFO -->
      <div style="margin-top:24px">
        <label class="field-label">Análise por parágrafo</label>
        <div style="font-size:12px;color:#9B9080;margin-bottom:12px">Clique em cada parágrafo para expandir a análise detalhada.</div>
        <div id="paragrafos-container">

        <div class="paragrafo-block">
          <div class="paragrafo-header" onclick="toggleParagrafo(this)">
            <div class="paragrafo-titulo">§1 — Introdução</div>
            <span class="paragrafo-badge bom">Bom</span>
          </div>
          <div class="paragrafo-body">
            <div class="paragrafo-texto" id="p1-texto">O isolamento do idoso na sociedade moderna representa um dos maiores paradoxos da contemporaneidade...</div>
            <div class="paragrafo-analise"><strong>Recursos coesivos:</strong> uso adequado de conectivos referenciais que situam o tema no contexto contemporâneo.<br><br><strong>Estrutura argumentativa:</strong> o parágrafo cumpre sua função de apresentação da tese de forma clara e direta.<br><br><strong>Sugestão:</strong> Enriqueça com um dado estatístico ou repertório cultural para ancorar a tese.</div>
            <div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> Antunes, I. — <em>Muito Além da Gramática</em>, Parábola Editorial, p. 88</div>
          </div>
        </div>

        <div class="paragrafo-block">
          <div class="paragrafo-header" onclick="toggleParagrafo(this)">
            <div class="paragrafo-titulo">§2 — Desenvolvimento I</div>
            <span class="paragrafo-badge bom">Bom</span>
          </div>
          <div class="paragrafo-body">
            <div class="paragrafo-texto" id="p2-texto">O avanço tecnológico, embora tenha aproximado pessoas geograficamente distantes...</div>
            <div class="paragrafo-analise"><strong>Recursos coesivos:</strong> o operador argumentativo <em>"embora"</em> introduz corretamente uma concessão, demonstrando domínio da sintaxe argumentativa.<br><br><strong>Estrutura argumentativa:</strong> apresenta causa-efeito de forma encadeada. A argumentação progride logicamente.<br><br><strong>Sugestão:</strong> Inclua um dado ou fonte para fortalecer o argumento — cite pesquisas do IBGE ou IPEA sobre envelhecimento.</div>
            <div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> Bechara, E. — <em>Moderna Gramática Portuguesa</em>, Lucerna, p. 431</div>
          </div>
        </div>

        <div class="paragrafo-block">
          <div class="paragrafo-header" onclick="toggleParagrafo(this)">
            <div class="paragrafo-titulo">§3 — Desenvolvimento II</div>
            <span class="paragrafo-badge regular">Regular</span>
          </div>
          <div class="paragrafo-body">
            <div class="paragrafo-texto" id="p3-texto">Ademais, a estrutura familiar contemporânea contribui para o afastamento dos idosos...</div>
            <div class="paragrafo-analise"><strong>Recursos coesivos:</strong> o conectivo <em>"ademais"</em> é adequado para adição argumentativa.<br><br><strong>Problema identificado:</strong> períodos longos comprometem a clareza sintática.<br><br><strong>Sugestão:</strong> Quebre os períodos longos. Prefira clareza à complexidade formal.</div>
            <div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> Perini, M. — <em>Gramática Descritiva do Português</em>, Ática, p. 89</div>
          </div>
        </div>

        <div class="paragrafo-block">
          <div class="paragrafo-header" onclick="toggleParagrafo(this)">
            <div class="paragrafo-titulo">§4 — Conclusão / Proposta</div>
            <span class="paragrafo-badge atencao">Atenção</span>
          </div>
          <div class="paragrafo-body">
            <div class="paragrafo-texto" id="p4-texto">Portanto, é necessário que o Ministério da Saúde implemente políticas públicas...</div>
            <div class="paragrafo-analise"><strong>Recursos coesivos:</strong> o conectivo <em>"portanto"</em> marca corretamente a conclusão lógica.<br><br><strong>Problema na proposta:</strong> a <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/redacao" target="_blank" class="paragrafo-link">Competência 5 do ENEM</a> exige 5 elementos. Sua proposta apresenta apenas 3.<br><br><strong>Sugestão:</strong> Inclua todos os elementos: agente + ação + modo/meio + finalidade + efeito esperado.</div>
            <div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/redacao" target="_blank">Cartilha do Participante — ENEM 2025, INEP</a></div>
          </div>
        </div>

        </div><!-- /paragrafos-container -->
      </div>

      <!-- PONTOS FORTES E DESVIOS -->
      <div style="margin-top:20px">
        <label class="field-label">Pontos fortes</label>
        <div id="pontos-fortes-container">
        <div class="result-block green"><div class="result-tag green">ponto forte</div><div class="result-text">Uso do conectivo <em>"embora"</em> com domínio da oração concessiva — sofisticação sintática evidente.</div></div>
        <div class="result-block green"><div class="result-tag green">ponto forte</div><div class="result-text">Conectivo <em>"ademais"</em> demonstra domínio de recursos coesivos formais — adequado ao gênero dissertativo-argumentativo.</div><div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> Antunes, I. — <em>Muito Além da Gramática</em>, Parábola Editorial, p. 112</div></div>
        </div>
      </div>
      <div style="margin-top:16px">
        <label class="field-label">Desvios identificados</label>
        <div id="desvios-container">
        <div class="result-block orange"><div class="result-tag orange">desvio gramatical</div><div class="result-text">"trato-se" — erro de clítico e conjugação. Forma correta: "trata-se". Estude a colocação pronominal na norma culta.</div><div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> Bechara, E. — <em>Moderna Gramática Portuguesa</em>, Lucerna, p. 228</div></div>
        <div class="result-block orange"><div class="result-tag orange">proposta incompleta</div><div class="result-text">Faltam <em>finalidade</em> e <em>efeito esperado</em> na proposta de intervenção. Inclua todos os <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/redacao" target="_blank" style="color:#C96A3A">5 elementos da C5</a>.</div></div>
        <div class="result-block yellow"><div class="result-tag yellow">coesão</div><div class="result-text">Períodos longos comprometem a clareza sintática. Quebre as orações subordinadas em sequências mais curtas e precisas.</div><div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> Perini, M. — <em>Gramática Descritiva do Português</em>, Ática, p. 89</div></div>
        </div>
      </div>

      <!-- COMENTÁRIO GERAL -->
      <div class="comentario-geral">
        <div class="comentario-geral-titulo">✦ Comentário geral do RedaCheck</div>
        <div class="comentario-geral-text" id="comentario-geral-text">Sua redação demonstra maturidade argumentativa e domínio satisfatório dos recursos coesivos da Língua Portuguesa. O encadeamento lógico entre os parágrafos é seu maior trunfo — a progressão temática está bem construída. O ponto crítico está na Competência 5: a proposta de intervenção incompleta custou pontos valiosos que poderiam colocar você acima dos 800 pontos. Para a próxima redação, concentre-se na completude da proposta e na redução dos períodos longos. Você está no caminho certo.</div>
        <div class="comentario-geral-assinatura">Avaliação fundamentada nos critérios do <a href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/redacao" target="_blank" style="color:rgba(255,255,255,0.4)">INEP/ENEM</a> e na metodologia de Irandé Antunes, Evanildo Bechara e Mário Perini — Especialistas em Língua Portuguesa Brasileira.</div>
      </div>

      <div class="philosophy-block"><div class="philo-title">Para ir além da nota</div><div class="philo-text">O aperfeiçoamento da escrita se constrói pela prática constante, pela observância às regras da gramática normativa e pela leitura ampla e diversificada. Como afirma <strong>Irandé Antunes</strong>, professora e pesquisadora da UFPE e autora de <em>Muito Além da Gramática</em> (Parábola Editorial), a língua é um instrumento de interação social que vai muito além das regras gramaticais.</div><div class="philo-quote">"Quanto mais você escrever — e ler — mais você construirá um texto de alto padrão."</div></div>
      <div class="feedback-block">
        <div style="font-size:12px;font-weight:700;color:#9B9080;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Avalie esta correção</div>
        <div class="stars" id="stars"><span class="star" onclick="rate(1)">&#9733;</span><span class="star" onclick="rate(2)">&#9733;</span><span class="star" onclick="rate(3)">&#9733;</span><span class="star" onclick="rate(4)">&#9733;</span><span class="star" onclick="rate(5)">&#9733;</span></div>
        <textarea id="feedback-text" placeholder="Deixe um comentário (opcional)..." style="height:80px;margin-bottom:8px"></textarea>
        <button class="btn-primary" onclick="enviarFeedback()" style="margin-top:0">Enviar feedback <i class="ti ti-send"></i></button>
        <div class="feedback-reply" id="feedback-reply"><div style="font-size:10px;font-weight:700;color:#8B4513;text-transform:uppercase;margin-bottom:6px">Resposta do RedaCheck</div><div class="feedback-reply-text" id="feedback-reply-text"></div></div>
      </div>
      <button class="btn-primary" onclick="gerarPDFAvaliacao()"><i class="ti ti-download"></i> Baixar avaliação em PDF</button>
      <button class="btn-secondary" onclick="goTo('dashboard')"><i class="ti ti-home"></i> Voltar ao início</button>
    </div>
  </div>

  <!-- DICAS PEDAGÓGICAS -->
  <div class="screen" id="screen-dicas">
    <div class="body">
      <div class="page-title">Dicas pedagógicas</div>
      <div class="page-sub">Dicas geradas pela IA com base nos critérios oficiais das bancas, nas melhores referências da Língua Portuguesa e nas orientações pedagógicas da <strong>Equipe Reda</strong> — porque aqui a tecnologia e o conhecimento humano caminham juntos.</div>

      <!-- Categorias -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px" id="dicas-categorias">
        <button class="filtro-btn active" onclick="buscarDica('',this)" style="background:#2D2D2D;border:1px solid #3D3D3D;color:#FAF9F7;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit">🎲 Aleatória</button>
        <button class="filtro-btn" onclick="buscarDica('norma-padrão e gramática',this)" style="background:#F5F2EE;border:1px solid #E5E0D8;color:#6B6255;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit">📖 Norma-padrão</button>
        <button class="filtro-btn" onclick="buscarDica('argumentação e estrutura dissertativa',this)" style="background:#F5F2EE;border:1px solid #E5E0D8;color:#6B6255;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit">💡 Argumentação</button>
        <button class="filtro-btn" onclick="buscarDica('repertório sociocultural produtivo',this)" style="background:#F5F2EE;border:1px solid #E5E0D8;color:#6B6255;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit">📚 Repertório</button>
        <button class="filtro-btn" onclick="buscarDica('proposta de intervenção C5 ENEM',this)" style="background:#F5F2EE;border:1px solid #E5E0D8;color:#6B6255;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit">✍️ Proposta C5</button>
        <button class="filtro-btn" onclick="buscarDica('conectivos e coesão textual',this)" style="background:#F5F2EE;border:1px solid #E5E0D8;color:#6B6255;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit">🔗 Conectivos</button>
        <button class="filtro-btn" onclick="buscarDica('especificidades da banca',this)" style="background:#F5F2EE;border:1px solid #E5E0D8;color:#6B6255;padding:5px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit">🎯 Sua banca</button>
      </div>

      <!-- Card da dica -->
      <div id="dica-card" style="display:none">
        <div style="background:#1A1A1A;border-radius:16px;padding:22px 20px;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <div style="width:34px;height:34px;background:#C96A3A;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="ti ti-bulb" style="font-size:16px;color:white"></i>
            </div>
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px" id="dica-categoria-label">—</div>
              <div style="font-size:15px;font-weight:700;color:#FAF9F7" id="dica-titulo">—</div>
            </div>
          </div>
          <p style="font-size:13px;color:rgba(255,255,255,0.82);line-height:1.8;margin-bottom:14px" id="dica-texto">—</p>
          <div style="background:rgba(201,106,58,0.15);border-left:3px solid #C96A3A;border-radius:0 10px 10px 0;padding:10px 14px;margin-bottom:14px">
            <div style="font-size:10px;color:#C96A3A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">⚠ Atenção</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.75);line-height:1.6" id="dica-atencao">—</div>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:12px">
            <div style="font-size:11px;color:rgba(255,255,255,0.35);font-style:italic" id="dica-ref">—</div>
          </div>
        </div>
        <div style="background:#FEF3EC;border:1px solid #F9D4BE;border-radius:12px;padding:12px 16px;margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;color:#C96A3A;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">📌 Lembre sempre</div>
          <div style="font-size:12px;color:#8B4513;line-height:1.7">A oralidade brasileira é rica, diversa e legítima em todos os seus contextos. Mas as bancas avaliam <strong>exclusivamente a norma-padrão escrita</strong>. O rigor gramatical é o parâmetro — não a fala cotidiana.</div>
        </div>
      </div>

      <!-- Loading -->
      <div id="dica-loading" style="text-align:center;padding:40px 20px">
        <i class="ti ti-loader-2" style="font-size:28px;color:#C96A3A;display:block;margin-bottom:12px;animation:spin 1.5s linear infinite"></i>
        <div style="font-size:13px;color:#9B9080">Gerando sua dica personalizada...</div>
      </div>

      <!-- Botão nova dica -->
      <button class="btn-primary" id="btn-nova-dica" onclick="buscarDica(dicaCategoriaAtual)" style="display:none">
        <i class="ti ti-refresh"></i> Gerar nova dica
      </button>
      <button class="btn-secondary" onclick="goTo('dashboard')" style="margin-top:8px">
        <i class="ti ti-arrow-left"></i> Voltar
      </button>
    </div>
  </div>

  <!-- HISTÓRICO -->
  <div class="screen" id="screen-hist">
    <div class="body">
      <div class="page-title">Minhas avaliações</div>
      <div class="page-sub">Acompanhe sua evolução ao longo do tempo.</div>
      <div id="hist-loading" style="text-align:center;padding:32px 0;color:#9B9080;font-size:13px;display:none">
        <i class="ti ti-loader-2" style="font-size:24px;display:block;margin-bottom:8px;animation:spin 1.5s linear infinite"></i>
        Carregando histórico...
      </div>
      <div id="hist-vazio" style="display:none;text-align:center;padding:32px 0;color:#9B9080;font-size:13px">
        <i class="ti ti-history" style="font-size:32px;display:block;margin-bottom:8px;color:#D5CFC7"></i>
        Nenhuma avaliação encontrada.<br>Envie sua primeira redação!
      </div>
      <div id="hist-lista"></div>
      <div id="hist-evol" style="display:none" class="dash-evol" style="margin-top:12px">
        <div class="dash-evol-label">Sua evolução</div>
        <div class="dash-evol-num" id="hist-evol-num">—</div>
        <div class="dash-evol-delta" id="hist-evol-delta"></div>
      </div>
      <button class="btn-primary" onclick="goTo('enviar')" style="margin-top:14px"><i class="ti ti-pencil"></i> Nova redação</button>
    </div>
  </div>

  <!-- CRÉDITOS -->
  <div class="screen" id="screen-creditos">
    <div class="body">
      <div class="page-title">Créditos</div>
      <div class="page-sub">Escolha o pacote ideal para você.</div>

      <!-- Saldo atual -->
      <div class="credito-saldo">
        <div class="credito-saldo-label">Avaliações disponíveis</div>
        <div class="credito-saldo-valor" id="credito-saldo-display">0</div>
        <div class="credito-saldo-sub" id="credito-redacoes-display">Compre um pacote para continuar</div>
      </div>

      <!-- Pacotes -->
      <div id="pacotes-lista" style="margin-bottom:16px"></div>

      <!-- Botão iniciar pagamento -->
      <button class="btn-primary" id="btn-pagar" onclick="iniciarPagamentoBrick()" style="margin-top:4px">
        <i class="ti ti-lock"></i> Pagar com segurança
      </button>
      <div id="pagamento-status" style="display:none;text-align:center;padding:12px;font-size:13px;color:#9B9080"></div>

      <!-- Container do Checkout Bricks (aparece após clicar em Pagar) -->
      <div id="brick-container" style="display:none;margin-top:16px">
        <div style="background:#F5F2EE;border-radius:14px;padding:16px;margin-bottom:12px">
          <div style="font-size:13px;font-weight:600;color:#1A1A1A;margin-bottom:4px">💳 Pagamento seguro</div>
          <div style="font-size:11px;color:#9B9080">Pix ou cartão — sem sair do RedaCheck</div>
        </div>
        <div id="cardPaymentBrick_container"></div>
        <button onclick="fecharBrick()" style="width:100%;margin-top:12px;background:transparent;border:1px solid #E5E0D8;border-radius:10px;padding:10px;font-size:13px;color:#9B9080;cursor:pointer;font-family:inherit">
          Cancelar
        </button>
      </div>

      <!-- Indicação -->
      <div class="divider"></div>
      <div class="indicacao-box">
        <div class="indicacao-titulo"><i class="ti ti-share" style="font-size:14px"></i> Indique e ganhe!</div>
        <div class="indicacao-sub">A cada <strong>10 indicações confirmadas</strong>, você ganha <strong>1 avaliação bônus</strong>.</div>
        <div style="margin-top:10px;display:flex;align-items:center;gap:8px">
          <div style="background:#FFFFFF;border:1px solid #F9D4BE;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:700;color:#C96A3A;letter-spacing:2px;flex:1;text-align:center" id="code-indicacao"></div>
          <button onclick="copiarCodigo()" style="background:#C96A3A;color:white;border:none;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit"><i class="ti ti-copy"></i> Copiar</button>
        </div>
      </div>
      <button class="btn-secondary" onclick="goTo('dashboard')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <!-- PERFIL DO USUÁRIO -->
  <div class="screen" id="screen-perfil-view">
    <div class="body">
      <div class="page-title">Meu perfil</div>
      <div class="user-code-box">
        <div><div class="user-code-label">Seu código RedaCheck</div><div class="user-code-value" id="user-code-perfil"></div></div>
        <button class="user-code-copy" onclick="copiarCodigo()"><i class="ti ti-copy"></i> Copiar</button>
      </div>
      <div style="background:#F5F2EE;border:1px solid #E5E0D8;border-radius:12px;padding:14px;margin-bottom:16px">
        <div class="sec-label" style="margin-bottom:10px">Estatísticas</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:#C96A3A">3</div><div style="font-size:11px;color:#9B9080">Redações</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:#16A34A">+80</div><div style="font-size:11px;color:#9B9080">Pontos ganhos</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:#1A1A1A" id="perfil-saldo-display">R$ 0</div><div style="font-size:11px;color:#9B9080">Saldo</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:#CA8A04">0</div><div style="font-size:11px;color:#9B9080">Indicações</div></div>
        </div>
      </div>
      <div class="indicacao-box">
        <div class="indicacao-titulo"><i class="ti ti-share" style="font-size:14px"></i> Programa de indicação</div>
        <div class="indicacao-sub">Compartilhe seu código. A cada <strong>10 amigos que criarem conta</strong> com seu código, você ganha <strong>1 redação bônus</strong> automaticamente!</div>
      </div>
      <button class="btn-primary" onclick="goTo('creditos')"><i class="ti ti-coin"></i> Gerenciar créditos</button>
      <button class="btn-secondary" onclick="goTo('dashboard')"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

  <!-- EXTRATO DE PAGAMENTOS -->
  <div class="screen" id="screen-extrato">
    <div class="body">
      <div class="page-title">Extrato financeiro</div>
      <div class="page-sub">Histórico completo de depósitos e débitos.</div>

      <!-- Saldo atual -->
      <div class="extrato-saldo-total">
        <div>
          <div style="font-size:10px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Saldo disponível</div>
          <div style="font-size:28px;font-weight:700;color:#FAF9F7" id="extrato-saldo-val">R$ 0,00</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px" id="extrato-preco-val">R$ 4,90 por redação</div>
        </div>
        <button onclick="goTo('creditos')" style="background:#C96A3A;color:white;border:none;border-radius:10px;padding:10px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px"><i class="ti ti-plus" style="font-size:13px"></i> Depositar</button>
      </div>

      <!-- Progresso de indicações -->
      <div class="extrato-indicacao-barra">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:12px;font-weight:600;color:#C96A3A;display:flex;align-items:center;gap:6px"><i class="ti ti-share" style="font-size:13px"></i> Programa de indicação</div>
          <div style="font-size:11px;font-weight:700;color:#C96A3A" id="extrato-indicacoes-count">0 / 10</div>
        </div>
        <div style="font-size:12px;color:#8B4513;margin-bottom:8px" id="extrato-indicacoes-texto">Indique 10 amigos e ganhe 1 redação bônus. Faltam <strong id="extrato-faltam">10</strong>.</div>
        <div class="extrato-indicacao-progress">
          <div class="extrato-indicacao-fill" id="extrato-indicacao-fill" style="width:0%"></div>
        </div>
      </div>

      <!-- Resumo rápido -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px">
        <div style="background:#F5F2EE;border:1px solid #E5E0D8;border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#16A34A" id="extrato-total-depositos">R$ 0</div>
          <div style="font-size:10px;color:#9B9080;margin-top:2px">Depositado</div>
        </div>
        <div style="background:#F5F2EE;border:1px solid #E5E0D8;border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#EA580C" id="extrato-total-gasto">R$ 0</div>
          <div style="font-size:10px;color:#9B9080;margin-top:2px">Utilizado</div>
        </div>
        <div style="background:#F5F2EE;border:1px solid #E5E0D8;border-radius:12px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#C96A3A" id="extrato-total-redacoes">0</div>
          <div style="font-size:10px;color:#9B9080;margin-top:2px">Redações</div>
        </div>
      </div>

      <!-- Lista de movimentações -->
      <div class="sec-label" style="margin-bottom:12px">Movimentações</div>
      <div style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:14px;padding:0 14px" id="extrato-lista">
        <div style="padding:20px 0;text-align:center;color:#9B9080;font-size:13px">Nenhuma movimentação ainda.</div>
      </div>

      <button class="btn-secondary" onclick="goTo('dashboard')" style="margin-top:20px"><i class="ti ti-arrow-left"></i> Voltar</button>
    </div>
  </div>

</div>
  <!-- pdf.js e jspdf carregados sob demanda (lazy) para não bloquear o carregamento inicial -->
  <script>
  let _pdfJsLoaded = false, _jsPdfLoaded = false;
  async function carregarPdfJs() {
    if(_pdfJsLoaded) return;
    await new Promise(res => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => { _pdfJsLoaded = true; res(); };
      document.head.appendChild(s);
    });
  }
  async function carregarJsPdf() {
    if(_jsPdfLoaded) return;
    await new Promise(res => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = () => { _jsPdfLoaded = true; res(); };
      document.head.appendChild(s);
    });
  }
  </script>
<script>
const BACKEND_URL = 'https://redacheck-backend-production-25c3.up.railway.app';
// Frontend v26 | Backend v8

let loggedIn=false, userName='', userNomeCompleto='', rating=0, bonusUsado=false;
let userCode='', saldoCreditos=0, precoAtual=4.90;
let totalDepositado=0, totalGasto=0, totalRedacoes=0, totalIndicacoes=0;
let totalIndicacoesReal=0; // total real vindo do banco
let movimentacoes=[];
let userBanca='ENEM';
let emailPendente = '';
let userIdBanco = null;
let userEmail = '';
let userDesconto = false;
let avaliacoesDisponiveis = 0;
let bonusJaUsado = false; // controla se o bônus de boas-vindas já foi usado
// Plano Professor
let userPlano='aluno'; // 'aluno' | 'professor'
let professorVerificado=false;
let professorRedacoesUsadas=0;
let professorRedacoesTotal=100;
let alunosVinculados=[]; // lista de códigos de alunos vinculados

function salvarSessaoLocal(){
  try {
    const sessao = {
      loggedIn, userName, userNomeCompleto, userCode,
      userBanca, userPlano, userIdBanco, userEmail,
      userDesconto, saldoCreditos, precoAtual,
      avaliacoesDisponiveis, bonusJaUsado, bonusUsado,
      totalIndicacoesReal, telaAtual: (()=>{ const t = document.querySelector('.screen.active')?.id?.replace('screen-','') || 'dashboard'; return ['proc','confirmar-saldo','boasvindas','perfil1','perfil2','perfil3','perfil4','perfil5'].includes(t) ? 'dashboard' : t; })()
    };
    localStorage.setItem('rc_usuario', JSON.stringify(sessao));
  } catch(e){}
}

function restaurarSessaoLocal(){
  try {
    const salvo = localStorage.getItem('rc_usuario');
    if(!salvo) return false;
    const s = JSON.parse(salvo);
    if(!s.loggedIn || !s.userName) return false;

    loggedIn = true;
    userName = s.userName || '';
    userNomeCompleto = s.userNomeCompleto || '';
    userCode = s.userCode || '';
    userBanca = s.userBanca || 'ENEM';
    userPlano = s.userPlano || 'aluno';
    userIdBanco = s.userIdBanco || null;
    userEmail = s.userEmail || '';
    userDesconto = s.userDesconto || false;
    saldoCreditos = s.saldoCreditos || 0;
    precoAtual = s.precoAtual || 4.90;
    avaliacoesDisponiveis = s.avaliacoesDisponiveis || 0;
    bonusJaUsado = s.bonusJaUsado || false;
    bonusUsado = s.bonusUsado || false;
    totalIndicacoesReal = s.totalIndicacoesReal || 0;

    // Atualizar UI
    const dashGreeting = document.getElementById('dash-greeting');
    if(dashGreeting) dashGreeting.textContent = 'Olá, ' + userName + '!';
    atualizarSaldo();
    atualizarHeaderUsuario();

    // Buscar saldo atualizado do banco em background
    if(userIdBanco){
      fetch(BACKEND_URL + '/saldo/' + userIdBanco)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if(d){
            avaliacoesDisponiveis = d.avaliacoes_disponiveis || 0;
            totalIndicacoesReal = d.total_indicacoes || 0;
            bonusJaUsado = avaliacoesDisponiveis === 0;
            atualizarSaldo();
            salvarSessaoLocal();
          }
        }).catch(()=>{});
    }

    // Restaurar tela — telas seguras para restaurar diretamente
    const telasSeguras = ['dashboard','enviar','hist','creditos','perfil-view','extrato','dicas'];
    const tela = s.telaAtual || 'dashboard';
    goTo(telasSeguras.includes(tela) ? tela : 'dashboard');
    return true;
  } catch(e){
    localStorage.removeItem('rc_usuario');
    return false;
  }
}
// Resultado IA e histórico

// ── GERAÇÃO DE PDF DA AVALIAÇÃO ───────────────────────────────────────
async function gerarPDFAvaliacao(){
  if(!resultadoIA){ alert('Nenhuma avaliação disponível para download.'); return; }
  await carregarJsPdf();
  if(typeof window.jspdf==='undefined'){ alert('Biblioteca de PDF ainda carregando. Tente novamente.'); return; }
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const TERRA=[201,106,58],DARK=[26,26,26],GRAY=[107,98,85],LIGHT=[245,240,235];
  const W=210,MARGIN=18,CONTENT=174,LH=4.5;
  let y=0;

  // Texto com quebra automática respeitando margem
  function txt(texto,x,maxW,cor,size,bold){
    if(!texto) return;
    doc.setFontSize(size||9);
    doc.setFont('helvetica',bold?'bold':'normal');
    if(cor) doc.setTextColor(...cor);
    const linhas=doc.splitTextToSize(String(texto),maxW||CONTENT);
    linhas.forEach(l=>{checkY(LH+1);doc.text(l,x||MARGIN,y);y+=LH;});
    y+=1;
  }

  // Texto justificado robusto
  function txtJ(texto,maxW,cor,size){
    if(!texto) return;
    const mw=maxW||CONTENT;
    doc.setFontSize(size||9);
    doc.setFont('helvetica','normal');
    if(cor) doc.setTextColor(...cor);
    const linhas=doc.splitTextToSize(String(texto),mw);
    linhas.forEach((linha,i)=>{
      checkY(LH+1);
      const isLast=(i===linhas.length-1);
      const palavras=linha.trim().split(/\s+/).filter(p=>p.length>0);
      if(!isLast&&palavras.length>1){
        const largTexto=palavras.reduce((acc,p)=>acc+doc.getTextWidth(p),0);
        const espacoEntre=(mw-largTexto)/(palavras.length-1);
        let x=MARGIN;
        palavras.forEach(p=>{doc.text(p,x,y);x+=doc.getTextWidth(p)+espacoEntre;});
      } else {
        doc.text(linha,MARGIN,y);
      }
      y+=LH;
    });
    y+=1;
  }
  function addPage(){
    doc.addPage();
    doc.setFillColor(...DARK);doc.rect(0,0,W,12,'F');
    doc.setFontSize(8);doc.setTextColor(250,249,247);doc.setFont('helvetica','normal');
    doc.text('REDACHECK — Relatório de Avaliação',MARGIN,8);
    doc.text('redacheck.com.br',W-MARGIN,8,{align:'right'});
    y=20;
  }
  function checkY(n){if(y+n>278)addPage();}
  function linha(cor){
    doc.setDrawColor(...(cor||TERRA));doc.setLineWidth(0.4);
    doc.line(MARGIN,y,W-MARGIN,y);y+=5;
  }
  function secTitle(t){
    checkY(14);
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(...TERRA);
    doc.text(t,MARGIN,y);y+=5;linha();
  }

  // ── CAPA ──────────────────────────────────────────────────────────
  doc.setFillColor(...DARK);doc.rect(0,0,W,55,'F');
  doc.setFillColor(...TERRA);doc.rect(0,53,W,2,'F');
  doc.setFontSize(28);doc.setTextColor(250,249,247);doc.setFont('helvetica','bold');
  doc.text('REDACHECK',W/2,22,{align:'center'});
  doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(...TERRA);
  doc.text('MAIS QUE CORRIGIR — APERFEIÇOAR',W/2,32,{align:'center'});
  doc.setFontSize(12);doc.setTextColor(200,195,188);
  doc.text('Relatório de Avaliação de Redação',W/2,43,{align:'center'});
  y=64;

  const banca=(resultadoIA.banca||userBanca||'ENEM').replace('_',' ');
  const nota=resultadoIA.notaGeral||0,nivel=resultadoIA.nivel||'—';
  const dataHoje=new Date().toLocaleDateString('pt-BR');
  const aluno=userNomeCompleto||userName||'—';

  // ── CARD NOTA ─────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT);doc.roundedRect(MARGIN,y,CONTENT,32,3,3,'F');
  doc.setFillColor(...TERRA);doc.roundedRect(MARGIN,y,42,32,3,3,'F');
  doc.setFontSize(24);doc.setFont('helvetica','bold');doc.setTextColor(250,249,247);
  doc.text(String(nota),MARGIN+21,y+19,{align:'center'});
  doc.setFontSize(7);doc.setTextColor(250,230,210);
  doc.text('NOTA FINAL',MARGIN+21,y+27,{align:'center'});
  doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(...DARK);
  doc.text('Banca: '+banca,MARGIN+48,y+10);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(...GRAY);
  doc.text('Nível: '+nivel,MARGIN+48,y+18);
  // Aluno e data com limite de largura
  const infoAluno=doc.splitTextToSize('Aluno: '+aluno,CONTENT-52);
  doc.text(infoAluno[0],MARGIN+48,y+25);
  doc.text('Data: '+dataHoje,MARGIN+48,y+30);
  y+=40;

  // ── LEGENDA DE CORES ──────────────────────────────────────────────
  checkY(14);
  doc.setFillColor(248,245,242);doc.roundedRect(MARGIN,y,CONTENT,12,2,2,'F');
  doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.setTextColor(...DARK);
  doc.text('LEGENDA:',MARGIN+3,y+5);
  // Verde
  doc.setFillColor(22,163,74);doc.roundedRect(MARGIN+22,y+2,8,4,1,1,'F');
  doc.setFont('helvetica','normal');doc.setTextColor(...GRAY);
  doc.text('Muito bom / Excelente (>=70%)',MARGIN+32,y+5.5);
  // Laranja
  doc.setFillColor(...TERRA);doc.roundedRect(MARGIN+22+72,y+2,8,4,1,1,'F');
  doc.text('Bom (>=40%)',MARGIN+32+72,y+5.5);
  // Vermelho
  doc.setFillColor(220,60,60);doc.roundedRect(MARGIN+22+72+32,y+2,8,4,1,1,'F');
  doc.text('A melhorar (<40%)',MARGIN+32+72+32,y+5.5);
  y+=18;

  // ── COMPETÊNCIAS ──────────────────────────────────────────────────
  if(resultadoIA.competencias&&resultadoIA.competencias.length){
    secTitle('NOTAS POR COMPETÊNCIA');
    resultadoIA.competencias.forEach(c=>{
      checkY(22);
      const pct=(c.nota/c.notaMaxima)*100,barW=CONTENT-55;
      // Descrição com quebra
      const descLinhas=doc.splitTextToSize(c.codigo+' — '+c.descricao,CONTENT-22);
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(...DARK);
      descLinhas.forEach(l=>{doc.text(l,MARGIN,y);y+=4;});
      y-=4; // voltar para alinhar nota à direita
      doc.setFont('helvetica','normal');doc.setTextColor(...TERRA);doc.setFontSize(9);
      doc.text(c.nota+'/'+c.notaMaxima,W-MARGIN,y,{align:'right'});
      y+=5;
      // Barra de progresso
      doc.setFillColor(229,224,216);doc.roundedRect(MARGIN,y,barW,2.5,1,1,'F');
      const cor=pct>=70?[22,163,74]:pct>=40?[...TERRA]:[220,60,60];
      doc.setFillColor(...cor);doc.roundedRect(MARGIN,y,Math.max(barW*(pct/100),1),2.5,1,1,'F');
      y+=5;
      // Justificativa
      if(c.justificativa){
        doc.setFontSize(8);doc.setTextColor(...GRAY);doc.setFont('helvetica','normal');
        const ls=doc.splitTextToSize(c.justificativa,CONTENT);
        const max=Math.min(ls.length,3);
        for(let i=0;i<max;i++){checkY(4);doc.text(ls[i],MARGIN,y);y+=4;}
        if(ls.length>3){doc.setTextColor(...TERRA);doc.text('[...]',MARGIN,y);y+=4;}
      }
      y+=3;
    });
  }

  // ── PONTOS FORTES ─────────────────────────────────────────────────
  if(resultadoIA.pontosFortes&&resultadoIA.pontosFortes.length){
    secTitle('PONTOS FORTES');
    resultadoIA.pontosFortes.forEach(p=>{
      checkY(12);
      doc.setFontSize(9);doc.setTextColor(...TERRA);doc.setFont('helvetica','bold');
      doc.text('+',MARGIN,y);
      doc.setTextColor(...DARK);doc.setFont('helvetica','normal');
      const ls=doc.splitTextToSize(String(p.descricao||''),CONTENT-8);
      ls.forEach(l=>{checkY(LH);doc.text(l,MARGIN+5,y);y+=LH;});
      y+=3;
    });
    y+=2;
  }

  // ── DESVIOS ───────────────────────────────────────────────────────
  if(resultadoIA.desviosIdentificados&&resultadoIA.desviosIdentificados.length){
    secTitle('DESVIOS GRAMATICAIS IDENTIFICADOS');
    resultadoIA.desviosIdentificados.forEach(d=>{
      checkY(20);
      // Cabeçalho eixo
      doc.setFillColor(...LIGHT);doc.rect(MARGIN,y-1,CONTENT,6,'F');
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(...TERRA);
      doc.text(String(d.eixo||'').substring(0,60),MARGIN+2,y+3);
      y+=8;
      // Trecho
      if(d.trecho){
        const tl=doc.splitTextToSize('"'+d.trecho+'"',CONTENT-4);
        const altT=tl.length*4+4;
        checkY(altT+2);
        doc.setFillColor(254,243,236);doc.roundedRect(MARGIN,y-1,CONTENT,altT,2,2,'F');
        doc.setFont('helvetica','italic');doc.setTextColor(...TERRA);
        tl.forEach(l=>{doc.text(l,MARGIN+3,y+2);y+=4;});
        y+=2;
      }
      // Correção
      if(d.correcao){
        const cl=doc.splitTextToSize('Correção: '+d.correcao,CONTENT);
        doc.setFont('helvetica','normal');doc.setTextColor(22,163,74);doc.setFontSize(9);
        cl.forEach(l=>{checkY(LH);doc.text(l,MARGIN,y);y+=LH;});
      }
      // Explicação justificada
      if(d.explicacao){
        doc.setFontSize(8);doc.setTextColor(...GRAY);
        txtJ(d.explicacao,CONTENT,GRAY,8);
      }
      y+=4;
    });
  }

  // ── COMENTÁRIO GERAL ──────────────────────────────────────────────
  if(resultadoIA.comentarioGeral){
    secTitle('COMENTÁRIO GERAL');
    txtJ(resultadoIA.comentarioGeral,CONTENT,GRAY,9);
    y+=4;
  }

  // ── BLOCO PEDAGÓGICO ──────────────────────────────────────────────
  checkY(34);
  doc.setFillColor(...DARK);doc.roundedRect(MARGIN,y,CONTENT,32,3,3,'F');
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(...TERRA);
  doc.text('Para ir além da nota',MARGIN+5,y+8);
  const frase='"Quanto mais você escrever — e ler — mais você construirá um texto de alto padrão."';
  const fl=doc.splitTextToSize(frase,CONTENT-10);
  doc.setFont('helvetica','italic');doc.setTextColor(220,215,208);doc.setFontSize(8.5);
  let yf=y+16;fl.forEach(l=>{doc.text(l,MARGIN+5,yf);yf+=5;});
  doc.setFont('helvetica','normal');doc.setTextColor(...TERRA);doc.setFontSize(7.5);
  doc.text('— Irandé Antunes, Muito Além da Gramática (Parábola Editorial)',MARGIN+5,y+28);
  y+=38;

  // ── REFERÊNCIAS ───────────────────────────────────────────────────
  checkY(55);
  doc.setDrawColor(...TERRA);doc.setLineWidth(0.3);doc.line(MARGIN,y,W-MARGIN,y);y+=5;
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(...DARK);
  doc.text('FONTES E REFERÊNCIAS BIBLIOGRÁFICAS',MARGIN,y);y+=5;
  const refs=[
    'CEGALLA, D. P. Novíssima Gramática da Língua Portuguesa. São Paulo: Companhia Editora Nacional.',
    'CUNHA, C.; CINTRA, L. Nova Gramática do Português Contemporâneo. 7ª ed. Rio de Janeiro: Lexikon, 2016.',
    'CUNHA, C. Gramática Essencial da Língua Portuguesa. Rio de Janeiro: Nova Fronteira.',
    'BECHARA, E. Moderna Gramática Portuguesa. 39ª ed. Rio de Janeiro: Nova Fronteira, 2019.',
    'MARCUSCHI, L. A. Gêneros Textuais: definição e funcionalidade. In: DIONÍSIO, A. P. et al. (orgs.). Gêneros Textuais e Ensino. Rio de Janeiro: Lucerna, 2002.',
    'MARCUSCHI, L. A. Produção Textual, Análise de Gêneros e Compreensão. São Paulo: Parábola Editorial, 2008.',
    'ANTUNES, I. Língua, Texto e Ensino: outra escola possível. São Paulo: Parábola Editorial, 2009.',
    'BORTONI-RICARDO, S. M. Educação em Língua Materna: a sociolinguística na sala de aula. São Paulo: Parábola, 2004.',
    'VOLP — Vocabulário Ortográfico da Língua Portuguesa. Academia Brasileira de Letras. www.academia.org.br/nossa-lingua/busca-no-vocabulario',
    'DLP — Dicionário da Língua Portuguesa. Academia Brasileira de Letras. servbib.academia.org.br/dlp',
    'Aulete Digital — Dicionário Contemporâneo da Língua Portuguesa. www.aulete.com.br',
    'INEP/MEC — A Redação no ENEM: do Enunciado à Nota Máxima. Brasília: INEP, 2019.'
  ];
  doc.setFont('helvetica','normal');doc.setTextColor(...GRAY);doc.setFontSize(7.5);
  refs.forEach(r=>{
    checkY(7);
    const rl=doc.splitTextToSize(r,CONTENT);
    rl.forEach(l=>{doc.text(l,MARGIN,y);y+=3.8;});
    y+=1.5;
  });
  y+=4;

  // ── RODAPÉ ────────────────────────────────────────────────────────
  checkY(12);
  doc.setDrawColor(229,224,216);doc.setLineWidth(0.2);doc.line(MARGIN,y,W-MARGIN,y);y+=4;
  doc.setFontSize(7);doc.setTextColor(180,170,160);
  doc.text('RedaCheck — redacheck.com.br — Gerado em '+dataHoje,W/2,y,{align:'center'});
  y+=3.5;
  doc.setFontSize(6.5);
  doc.text('Este relatório foi gerado por inteligência artificial e fundamentado nas fontes gramaticais e lexicográficas listadas acima.',W/2,y,{align:'center'});

  doc.save('RedaCheck_Avaliacao_'+banca+'_'+dataHoje.replace(/\//g,'-')+'.pdf');
}

let dicaCategoriaAtual = '';

async function buscarDica(categoria, btn){
  dicaCategoriaAtual = categoria;

  // Atualizar botões de categoria
  if(btn){
    document.querySelectorAll('#dicas-categorias button').forEach(b => {
      b.style.background = '#F5F2EE';
      b.style.color = '#6B6255';
      b.style.borderColor = '#E5E0D8';
    });
    btn.style.background = '#1A1A1A';
    btn.style.color = '#FAF9F7';
    btn.style.borderColor = '#1A1A1A';
  }

  document.getElementById('dica-card').style.display = 'none';
  document.getElementById('dica-loading').style.display = 'block';
  document.getElementById('btn-nova-dica').style.display = 'none';

  try {
    const params = new URLSearchParams({ banca: userBanca || 'ENEM' });
    if(categoria) params.set('categoria', categoria);
    const resp = await fetch(BACKEND_URL + '/dica?' + params.toString());
    const data = await resp.json();

    if(data.dica){
      const d = data.dica;
      document.getElementById('dica-categoria-label').textContent = d.categoria || categoria || 'Dica pedagógica';
      document.getElementById('dica-titulo').textContent = d.titulo || '—';
      document.getElementById('dica-texto').textContent = d.dica || '—';
      document.getElementById('dica-atencao').textContent = d.atencao || '—';
      document.getElementById('dica-ref').textContent = d.referencia || '—';
      document.getElementById('dica-loading').style.display = 'none';
      document.getElementById('dica-card').style.display = 'block';
      document.getElementById('btn-nova-dica').style.display = 'flex';
    } else {
      document.getElementById('dica-loading').innerHTML = '<div style="color:#EA580C;font-size:13px">Não foi possível gerar a dica. Tente novamente.</div>';
    }
  } catch(e) {
    document.getElementById('dica-loading').innerHTML = '<div style="color:#EA580C;font-size:13px">Erro de conexão. Tente novamente.</div>';
  }
}

let resultadoIA = null;
let avaliacaoAtualId = null;

function sair(){
  loggedIn=false;
  userName='';
  userNomeCompleto='';
  userCode='';
  saldoCreditos=0;
  bonusUsado=false;
  resultadoIA=null;
  userBanca='ENEM';
  userPlano='aluno';
  movimentacoes=[];
  totalIndicacoesReal=0;
  try {
    localStorage.removeItem('rc_usuario');
    localStorage.removeItem('rc_chat_' + (userCode || 'anonimo'));
  } catch(e){}
  redaHistorico = [];
  redaPrimeiraVez = true;
  redaInicioConversa = null;
  // Limpar todos os uploads
  limparTodosUploads();
  // Limpar campos de login
  const emailEl = document.getElementById('login-email');
  const senhaEl = document.getElementById('login-senha');
  if(emailEl) emailEl.value = '';
  if(senhaEl) senhaEl.value = '';
  // Resetar header
  const bar=document.getElementById('user-header-bar');
  if(bar) bar.style.display='none';
  goTo('home');
}

function toggleCND(show){
  document.getElementById('cnd-box').style.display = show ? 'block' : 'none';
  document.getElementById('label-prof-sim').style.borderColor = show ? '#C96A3A' : '#E5E0D8';
  document.getElementById('label-prof-nao').style.borderColor = show ? '#E5E0D8' : '#C96A3A';
}

let cndBase64 = null;
let cndFileName = '';

// cndSelecionado — definida abaixo (versão completa)

function gerarCodigo(nome){
  const prefixo='RC';
  const ano=new Date().getFullYear();
  const rand=Math.floor(10000+Math.random()*90000);
  return prefixo+'-'+ano+'-'+rand;
}

function adicionarMovimentacao(tipo, descricao, valor){
  const agora=new Date();
  const data=agora.toLocaleDateString('pt-BR')+' '+agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  movimentacoes.unshift({tipo, descricao, valor, data});
}

function renderizarExtrato(){
  const lista=document.getElementById('extrato-lista');
  if(!lista) return;
  if(movimentacoes.length===0){
    lista.innerHTML='<div style="padding:20px 0;text-align:center;color:#9B9080;font-size:13px">Nenhuma movimentação ainda.</div>';
    return;
  }
  lista.innerHTML=movimentacoes.map(m=>`
    <div class="extrato-item">
      <div class="extrato-icon ${m.tipo}"><i class="ti ti-${m.tipo==='entrada'?'arrow-down-circle':'arrow-up-circle'}"></i></div>
      <div class="extrato-desc">
        <div class="extrato-desc-title">${m.descricao}</div>
        <div class="extrato-desc-date">${m.data}</div>
      </div>
      <div class="extrato-valor ${m.tipo}">${m.tipo==='entrada'?'+':'-'} R$ ${m.valor.toFixed(2).replace('.',',')}</div>
    </div>
  `).join('');
}

function atualizarHeaderUsuario(){
  if(!loggedIn) return;
  const bar=document.getElementById('user-header-bar');
  if(bar) bar.style.display='flex';
  const nomeEl=document.getElementById('user-header-nome');
  if(nomeEl) nomeEl.textContent=userNomeCompleto||userName;
  const codEl=document.getElementById('user-header-codigo');
  if(codEl) codEl.textContent=userCode;
  const saldoEl=document.getElementById('user-header-saldo');
  if(saldoEl) saldoEl.textContent='R$ '+saldoCreditos.toFixed(2).replace('.',',');
}

function atualizarExtrato(){
  if(document.getElementById('extrato-saldo-val')) document.getElementById('extrato-saldo-val').textContent='R$ '+saldoCreditos.toFixed(2).replace('.',',');
  if(document.getElementById('extrato-preco-val')) document.getElementById('extrato-preco-val').textContent='R$ '+precoAtual.toFixed(2)+' por redação';
  if(document.getElementById('extrato-total-depositos')) document.getElementById('extrato-total-depositos').textContent='R$ '+totalDepositado.toFixed(0);
  if(document.getElementById('extrato-total-gasto')) document.getElementById('extrato-total-gasto').textContent='R$ '+totalGasto.toFixed(0);
  if(document.getElementById('extrato-total-redacoes')) document.getElementById('extrato-total-redacoes').textContent=totalRedacoes;
  const cicloAtual = totalIndicacoesReal % 10; // progresso no ciclo de 10
  const perc=Math.min((cicloAtual/10)*100,100);
  const faltam=Math.max(10-cicloAtual,0);
  const cicloNum = Math.floor(totalIndicacoesReal/10)+1; // qual ciclo estamos
  if(document.getElementById('extrato-indicacoes-count')) document.getElementById('extrato-indicacoes-count').textContent=totalIndicacoesReal+' / '+(cicloNum*10);
  if(document.getElementById('extrato-faltam')) document.getElementById('extrato-faltam').textContent=faltam;
  if(document.getElementById('extrato-indicacao-fill')) document.getElementById('extrato-indicacao-fill').style.width=perc+'%';
  renderizarExtrato();
}

function calcularPreco(saldo){
  if(saldo>=500) return 2.90;
  if(saldo>=200) return 3.90;
  return 4.90;
}

function calcularDesconto(){
  const val=parseFloat(document.getElementById('deposito-valor').value)||0;
  const preview=document.getElementById('desconto-preview');
  if(val<=0){preview.style.display='none';return;}
  let preco=calcularPreco(saldoCreditos+val);
  let desconto='';
  if(val>=500||saldoCreditos+val>=500) desconto='Desconto de 40% — R$ 2,90 por redação';
  else if(val>=200||saldoCreditos+val>=200) desconto='Desconto de 20% — R$ 3,90 por redação';
  else desconto='Sem desconto — R$ 4,90 por redação. Deposite R$ '+(200-saldoCreditos-val).toFixed(2)+' a mais para obter desconto.';
  preview.style.display='block';
  preview.innerHTML='<strong>Com este depósito:</strong> '+desconto+'<br><strong>Saldo total:</strong> R$ '+(saldoCreditos+val).toFixed(2);
}

function depositar(){
  const val=parseFloat(document.getElementById('deposito-valor').value)||0;
  if(val<10){alert('Valor mínimo de depósito: R$ 10,00');return;}
  saldoCreditos+=val;
  totalDepositado+=val;
  precoAtual=calcularPreco(saldoCreditos);
  adicionarMovimentacao('entrada','Depósito de créditos',val);
  atualizarSaldo();
  document.getElementById('deposito-valor').value='';
  document.getElementById('desconto-preview').style.display='none';
  alert('Depósito de R$ '+val.toFixed(2)+' realizado! Novo saldo: R$ '+saldoCreditos.toFixed(2));
}

function atualizarSaldo(){
  const s='R$ '+saldoCreditos.toFixed(2).replace('.',',');
  const redacoes=Math.floor(saldoCreditos/precoAtual);
  if(document.getElementById('dash-saldo')) document.getElementById('dash-saldo').textContent=s;
  if(document.getElementById('credito-saldo-display')) document.getElementById('credito-saldo-display').textContent=s;
  if(document.getElementById('credito-redacoes-display')) document.getElementById('credito-redacoes-display').textContent=redacoes+' redações disponíveis ao preço de R$ '+precoAtual.toFixed(2);
  if(document.getElementById('pay-credito-desc')) document.getElementById('pay-credito-desc').textContent='Saldo: '+s;
  if(document.getElementById('perfil-saldo-display')) document.getElementById('perfil-saldo-display').textContent='R$ '+Math.floor(saldoCreditos);
  if(document.getElementById('preco-pix')) document.getElementById('preco-pix').textContent='R$ '+precoAtual.toFixed(2);
  if(document.getElementById('preco-cartao')) document.getElementById('preco-cartao').textContent='R$ '+precoAtual.toFixed(2);
  if(document.getElementById('preco-credito')) document.getElementById('preco-credito').textContent='R$ '+precoAtual.toFixed(2);
  atualizarHeaderUsuario();
}

function copiarCodigo(){
  navigator.clipboard.writeText(userCode).then(()=>alert('Código '+userCode+' copiado!')).catch(()=>alert('Seu código: '+userCode));
}

function goTo(s){
  // Bloquear acesso a telas protegidas sem login
  const telasProtegidas=['dashboard','enviar','hist','result','creditos','perfil-view','extrato','professor-painel','confirmar-saldo','dicas'];
  if(telasProtegidas.includes(s) && !loggedIn){
    goTo('login');
    return;
  }
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  document.getElementById('screen-'+s).classList.add('active');
  const nav=document.getElementById('nav');
  const semNav=['boasvindas','perfil1','perfil2','perfil3','perfil4','perfil5','perfilok','proc','planos','professor-cadastro','professor-pendente'];
  if(semNav.includes(s)){nav.style.display='none';}
  else if(loggedIn){
    nav.style.display='flex';
    nav.innerHTML=`<div class="nav-tab ${s==='dashboard'?'active':''}" onclick="goTo('dashboard')">Início</div><div class="nav-tab ${s==='enviar'?'active':''}" onclick="goTo('enviar')">Nova redação</div><div class="nav-tab ${s==='hist'?'active':''}" onclick="goTo('hist')">Avaliações</div><div class="nav-tab" onclick="sair()" style="color:#EA580C"><i class="ti ti-logout" style="font-size:12px"></i> Sair</div>`;
    if(s==='enviar'){
      limparTodosUploads();
      // Resetar modo para Digitar
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
      const btnDigitar = document.querySelector('.mode-btn');
      if(btnDigitar) btnDigitar.classList.add('selected');
      if(document.getElementById('m-digitar')) document.getElementById('m-digitar').style.display='block';
      if(document.getElementById('m-foto')) document.getElementById('m-foto').style.display='none';
      if(document.getElementById('m-arquivo')) document.getElementById('m-arquivo').style.display='none';
      if(document.getElementById('bonus-aviso')) document.getElementById('bonus-aviso').style.display='none';
      if(document.getElementById('pagamento-section')) document.getElementById('pagamento-section').style.display='none';
      if(document.getElementById('btn-enviar')) document.getElementById('btn-enviar').innerHTML='Enviar para avaliação <i class="ti ti-arrow-right"></i>';
    }
    if(s==='creditos'){
      renderizarPacotes();
      document.getElementById('credito-saldo-display').textContent = avaliacoesDisponiveis || '0';
      document.getElementById('credito-redacoes-display').textContent =
        (avaliacoesDisponiveis > 0) ? `${avaliacoesDisponiveis} avaliação(ões) disponível(is)` : 'Compre um pacote para continuar';
      if(document.getElementById('code-indicacao')) document.getElementById('code-indicacao').textContent = userCode || '—';
      atualizarSaldo();
    }
    if(s==='perfil-view'){
      if(document.getElementById('user-code-perfil')) document.getElementById('user-code-perfil').textContent=userCode;
      atualizarSaldo();
    }
    if(s==='extrato') atualizarExtrato();
    if(s==='hist') carregarHistorico('hist');
    if(s==='dicas') buscarDica(dicaCategoriaAtual || '');
    if(s==='dashboard') carregarHistorico('dashboard');
    if(s==='professor-painel'){
      atualizarPainelProfessor();
      renderizarAlunos();
    }
  }else{
    nav.style.display='flex';
    nav.innerHTML='<div class="nav-tab '+(s==='home'||s==='cadastro'?'active':'')+'" onclick="goTo(\'home\')">Início</div><div class="nav-tab '+(s==='login'?'active':'')+'" onclick="goTo(\'login\')">Entrar</div>';
  }
  window.scrollTo(0,0);
}

function verificarIdade(d){
  if(!d)return;
  const nasc=new Date(d),hoje=new Date();
  let idade=hoje.getFullYear()-nasc.getFullYear();
  if(hoje.getMonth()-nasc.getMonth()<0||(hoje.getMonth()-nasc.getMonth()===0&&hoje.getDate()<nasc.getDate()))idade--;
  const show=idade<18&&idade>0;
  document.getElementById('menor-box').style.display=show?'block':'none';
  document.getElementById('check-menor-row').style.display=show?'flex':'none';
}

// ── RECUPERAÇÃO DE SENHA ──────────────────────────────────────────────
let emailRecuperacao = '';

async function solicitarRecuperacao(apenasReenviar = false){
  const emailInput = document.getElementById('recuperar-email');
  const email = apenasReenviar ? emailRecuperacao : (emailInput ? emailInput.value.trim() : '');

  if(!email){ alert('Digite seu e-mail.'); return; }

  const btn = document.querySelector('#screen-recuperar .btn-primary');
  if(btn && !apenasReenviar){ btn.disabled=true; btn.textContent='Enviando...'; }

  try {
    const resp = await fetch(BACKEND_URL+'/recuperar-senha', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    const data = await resp.json();

    if(!resp.ok){
      alert(data.erro || 'E-mail não encontrado.');
      if(btn){ btn.disabled=false; btn.innerHTML='Enviar código <i class="ti ti-send"></i>'; }
      return;
    }

    emailRecuperacao = email;
    document.getElementById('nova-senha-email-display').textContent = email;
    if(btn){ btn.disabled=false; btn.innerHTML='Enviar código <i class="ti ti-send"></i>'; }

    if(apenasReenviar){
      alert('Novo código enviado para ' + email);
    } else {
      goTo('nova-senha');
    }

  } catch(e) {
    alert('Erro de conexão. Tente novamente.');
    if(btn){ btn.disabled=false; btn.innerHTML='Enviar código <i class="ti ti-send"></i>'; }
  }
}

async function redefinirSenha(){
  const codigo = document.getElementById('nova-senha-codigo').value.trim();
  const novaSenha = document.getElementById('nova-senha-input').value;
  const confirmar = document.getElementById('nova-senha-confirmar').value;

  if(codigo.length !== 6){ alert('Digite o código de 6 dígitos.'); return; }
  if(novaSenha.length < 6){ alert('A senha deve ter no mínimo 6 caracteres.'); return; }
  if(novaSenha !== confirmar){ alert('As senhas não coincidem.'); return; }

  const btn = document.querySelector('#screen-nova-senha .btn-primary');
  if(btn){ btn.disabled=true; btn.textContent='Redefinindo...'; }

  try {
    const resp = await fetch(BACKEND_URL+'/redefinir-senha', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email: emailRecuperacao, codigo, novaSenha})
    });
    const data = await resp.json();

    if(!resp.ok){
      alert(data.erro || 'Código inválido ou expirado.');
      if(btn){ btn.disabled=false; btn.innerHTML='Redefinir senha <i class="ti ti-check"></i>'; }
      return;
    }

    alert('Senha redefinida com sucesso! Faça login com a nova senha.');
    emailRecuperacao = '';
    if(btn){ btn.disabled=false; btn.innerHTML='Redefinir senha <i class="ti ti-check"></i>'; }
    goTo('login');

  } catch(e) {
    alert('Erro de conexão. Tente novamente.');
    if(btn){ btn.disabled=false; btn.innerHTML='Redefinir senha <i class="ti ti-check"></i>'; }
  }
}

async function confirmarEmail(){
  const codigo = document.getElementById('confirmar-codigo').value.trim();
  if(codigo.length !== 6){ alert('Digite o código de 6 dígitos.'); return; }

  const btn = document.querySelector('#screen-confirmar .btn-primary');
  if(btn){ btn.disabled=true; btn.textContent='Confirmando...'; }

  try {
    const resp = await fetch(BACKEND_URL+'/confirmar', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email: emailPendente, codigo})
    });
    const data = await resp.json();

    if(!resp.ok){
      alert(data.erro || 'Código inválido.');
      if(btn){ btn.disabled=false; btn.innerHTML='Confirmar e-mail <i class="ti ti-check"></i>'; }
      return;
    }

    // Conta confirmada — fazer login automático
    const u = data.usuario;
    userNomeCompleto = u.nome;
    userName = u.nome.split(' ')[0];
    userCode = u.codigo;
    userBanca = u.banca || 'ENEM';
    userPlano = u.plano || 'aluno';
    userIdBanco = u.id || null;
    userEmail = u.email || emailPendente || '';
    avaliacoesDisponiveis = u.avaliacoes_disponiveis || 1; // bônus de boas-vindas
    bonusJaUsado = false;
    loggedIn = true;
    bonusUsado = false;

    document.getElementById('bonus-chip').style.display='inline-flex';
    document.getElementById('welcome-name').textContent = userName+',';
    document.getElementById('perfil-nome').textContent = userName;
    document.getElementById('user-code-display').textContent = userCode;
    atualizarHeaderUsuario();

    if(btn){ btn.disabled=false; btn.innerHTML='Confirmar e-mail <i class="ti ti-check"></i>'; }
    salvarSessaoLocal();
    goTo('boasvindas');

  } catch(e) {
    alert('Erro de conexão. Tente novamente.');
    if(btn){ btn.disabled=false; btn.innerHTML='Confirmar e-mail <i class="ti ti-check"></i>'; }
  }
}

async function reenviarCodigo(){
  // Tentar recuperar e-mail do display se emailPendente estiver vazio
  if(!emailPendente){
    const display = document.getElementById('confirmar-email-display');
    if(display && display.textContent) emailPendente = display.textContent.trim();
  }
  if(!emailPendente){ alert('E-mail não encontrado. Faça o cadastro novamente.'); return; }
  try {
    const resp = await fetch(BACKEND_URL+'/reenviar-codigo', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email: emailPendente})
    });
    const data = await resp.json();
    if(data.ok) alert('Novo código enviado para ' + emailPendente);
    else alert(data.erro || 'Erro ao reenviar.');
  } catch(e) {
    alert('Erro de conexão.');
  }
}

async function cadastrar(){
  const nome=document.getElementById('cad-nome').value.trim();
  const email=document.getElementById('cad-email').value.trim();
  const senha=document.getElementById('cad-senha').value;
  const whatsapp=document.getElementById('cad-whatsapp').value.replace(/\D/g,'');
  const whatsappMkt=document.getElementById('check-whatsapp-mkt').checked;
  const ehProfessor = document.getElementById('cad-prof-sim').checked;
  if(ehProfessor && !cndBase64){
    alert('Por favor, envie o Documento Nacional Docente (CND) para ativar o desconto de professor.');
    return;
  }
  const nasc=document.getElementById('cad-nasc').value;
  const ano=document.getElementById('cad-ano').value;
  const escola=document.getElementById('cad-escola').value;
  if(!nome||!email||!senha||!nasc||!ano||!escola){alert('Preencha todos os campos.');return;}
  if(!document.getElementById('check-termos').checked||!document.getElementById('check-lgpd').checked){alert('Aceite os termos para continuar.');return;}
  if(document.getElementById('menor-box').style.display==='block'&&!document.getElementById('check-menor').checked){alert('Necessária autorização do responsável legal.');return;}

  const btnCadastrar = document.querySelector('#screen-cadastro .btn-primary');
  if(btnCadastrar){ btnCadastrar.disabled=true; btnCadastrar.textContent='Criando conta...'; }

  try {
    const resp = await fetch(BACKEND_URL+'/cadastro', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nome, email, senha, banca:userBanca||'ENEM', plano:'aluno', escola: escola||null, whatsapp: whatsapp||null, whatsapp_mkt: whatsappMkt, professor: ehProfessor ? 'pendente' : 'nao', cnd_base64: cndBase64||null, cnd_arquivo: cndFileName||null, codigo_indicante: (document.getElementById('cad-indicacao')?.value?.trim()?.toUpperCase())||null})
    });
    const data = await resp.json();

    if(!resp.ok){
      alert(data.erro || 'Erro ao criar conta.');
      if(btnCadastrar){ btnCadastrar.disabled=false; btnCadastrar.textContent='Criar conta'; }
      return;
    }

    // Salvar e-mail para confirmação
    emailPendente = email;
    nomeCompleto = nome;
    document.getElementById('confirmar-email-display').textContent = email;

    if(btnCadastrar){ btnCadastrar.disabled=false; btnCadastrar.innerHTML='Criar conta <i class="ti ti-arrow-right"></i>'; }
    goTo('confirmar');

  } catch(e) {
    alert('Erro de conexão. Tente novamente.');
    if(btnCadastrar){ btnCadastrar.disabled=false; btnCadastrar.innerHTML='Criar conta <i class="ti ti-arrow-right"></i>'; }
  }
}

async function login(){
  const emailEl = document.getElementById('login-email');
  const senhaEl = document.getElementById('login-senha');
  const email = emailEl ? emailEl.value.trim() : '';
  const senha = senhaEl ? senhaEl.value.trim() : '';
  if(!email || !senha){ alert('Preencha e-mail e senha.'); return; }

  const btnLogin = document.querySelector('#screen-login .btn-primary');
  if(btnLogin){ btnLogin.disabled=true; btnLogin.textContent='Entrando...'; }

  try {
    const resp = await fetch(BACKEND_URL+'/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email, senha})
    });
    const data = await resp.json();

    if(!resp.ok){
      if(data.precisaConfirmar){
        emailPendente = data.email;
        document.getElementById('confirmar-email-display').textContent = data.email;
        alert('Sua conta ainda não foi confirmada. Insira o código enviado para seu e-mail.');
        if(btnLogin){ btnLogin.disabled=false; btnLogin.innerHTML='Entrar <i class="ti ti-arrow-right"></i>'; }
        goTo('confirmar');
        return;
      }
      alert(data.erro || 'Erro ao fazer login.');
      if(btnLogin){ btnLogin.disabled=false; btnLogin.innerHTML='Entrar <i class="ti ti-arrow-right"></i>'; }
      return;
    }

    const u = data.usuario;
    userNomeCompleto = u.nome;
    userName = u.nome.split(' ')[0];
    userCode = u.codigo;
    userBanca = u.banca || 'ENEM';
    userPlano = u.plano || 'aluno';
    saldoCreditos = parseFloat(u.saldo) || 0;
    userIdBanco = u.id;
    userEmail = u.email;
    userDesconto = u.desconto_professor || false;
    avaliacoesDisponiveis = u.avaliacoes_disponiveis || 0;
    totalIndicacoesReal = u.total_indicacoes || 0;
    totalIndicacoes = totalIndicacoesReal % 10;
    // Status professor — backend agora retorna campo professor
    if(u.professor === 'aprovado' || u.desconto_professor) userDesconto = true; // progresso dentro do ciclo atual
    loggedIn = true;
    // Bônus: já foi usado se o usuário já fez pelo menos 1 redação
    bonusJaUsado = (u.total_redacoes || 0) > 0;
    bonusUsado = bonusJaUsado;

    document.getElementById('dash-greeting').textContent='Olá, '+userName+'!';
    atualizarSaldo();
    atualizarHeaderUsuario();
    salvarSessaoLocal();
    if(btnLogin){ btnLogin.disabled=false; btnLogin.innerHTML='Entrar <i class="ti ti-arrow-right"></i>'; }
    goTo('dashboard');

  } catch(e) {
    alert('Erro de conexão. Tente novamente.');
    if(btnLogin){ btnLogin.disabled=false; btnLogin.innerHTML='Entrar <i class="ti ti-arrow-right"></i>'; }
  }
}

function concluirPerfil(){
  document.getElementById('dash-greeting').textContent='Olá, '+userName+'!';
  if(!bonusUsado)document.getElementById('dash-bonus').style.display='inline-flex';
  atualizarSaldo();
  atualizarHeaderUsuario();
  goTo('dashboard');
}

document.addEventListener('DOMContentLoaded',function(){
  const btn=document.getElementById('btn-perfilok');
  if(btn)btn.onclick=concluirPerfil;
  // ── Restaurar sessão E verificar retorno MP (sempre, independente da sessão) ──
  restaurarSessaoLocal();
  verificarRetornoPagamento();
});

function selOption(el){el.closest('.option-list').querySelectorAll('.option-item').forEach(i=>i.classList.remove('selected'));el.classList.add('selected');}
function selCard(el,group){
  if(group){el.closest('.option-grid').querySelectorAll('.option-card[data-g="'+group+'"]').forEach(c=>c.classList.remove('selected'));el.setAttribute('data-g',group);}
  else{el.closest('.option-grid').querySelectorAll('.option-card:not([data-t])').forEach(c=>c.classList.remove('selected'));}
  el.classList.add('selected');
}
function toggleCard(el){el.setAttribute('data-t','1');el.classList.toggle('selected');}
function selMode(el,mode){
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  ['digitar','foto','arquivo'].forEach(m=>{document.getElementById('m-'+m).style.display=m===mode?'block':'none';});
  // Limpar uploads ao trocar de modo
  limparTodosUploads();
}
// selPag — definida abaixo (versão com metodoPagamento)

function toggleParagrafo(header){
  const body=header.nextElementSibling;
  body.classList.toggle('open');
}

// ── PAGAMENTO — MERCADO PAGO ──────────────────────────────────────────
const PACOTES_MP = {
  avulso:        { avaliacoes: 1,  valor: 4.90,  label: 'Avulso',        economia: null },
  basico:        { avaliacoes: 5,  valor: 19.90, label: '5 avaliações',  economia: 'Economia de 19%' },
  intermediario: { avaliacoes: 10, valor: 34.90, label: '10 avaliações', economia: 'Economia de 29%' },
  avancado:      { avaliacoes: 20, valor: 68.60, label: '20 avaliações', economia: 'Economia de 30%' }
};
const PACOTES_MP_PROF = {
  avulso:        { avaliacoes: 1,  valor: 2.45,  label: 'Avulso professor',        economia: '50% de desconto' },
  basico:        { avaliacoes: 5,  valor: 9.95,  label: '5 avaliações professor',  economia: 'Economia de 19% + 50%' },
  intermediario: { avaliacoes: 10, valor: 17.45, label: '10 avaliações professor', economia: 'Economia de 29% + 50%' },
  avancado:      { avaliacoes: 20, valor: 34.30, label: '20 avaliações professor', economia: 'Economia de 30% + 50%' }
};

let pacoteSelecionado = 'avulso';
let metodoPagamento = 'pix';

function renderizarPacotes(){
  const container = document.getElementById('pacotes-lista');
  if(!container) return;
  const isProfessor = userPlano === 'professor' || userDesconto;
  const pacotes = isProfessor ? PACOTES_MP_PROF : PACOTES_MP;

  container.innerHTML = Object.entries(pacotes).map(([id, p]) => `
    <div class="credito-linha ${id === pacoteSelecionado ? 'credito-destaque' : ''}"
         onclick="selecionarPacote('${id}')"
         style="cursor:pointer;border:2px solid ${id === pacoteSelecionado ? '#C96A3A' : '#E5E0D8'};border-radius:12px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:13px;font-weight:700;color:#1A1A1A">${p.label}</div>
        <div style="font-size:11px;color:${p.economia ? '#16A34A' : '#9B9080'};margin-top:2px">${p.economia || 'Sem desconto'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:16px;font-weight:700;color:#C96A3A">R$ ${p.valor.toFixed(2).replace('.',',')}</div>
        <div style="font-size:11px;color:#9B9080">${p.avaliacoes} avaliação${p.avaliacoes > 1 ? 'ões' : ''}</div>
      </div>
    </div>
  `).join('');
}

function selecionarPacote(id){
  pacoteSelecionado = id;
  renderizarPacotes();
}

function selPag(el, metodo){
  document.querySelectorAll('.pay-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  metodoPagamento = metodo;
}

// ══════════════════════════════════════════════════════════════════════
// CHECKOUT BRICKS — pagamento embutido no RedaCheck
// ══════════════════════════════════════════════════════════════════════
let _brickController = null;

function fecharBrick(){
  if(_brickController){ _brickController.unmount(); _brickController = null; }
  document.getElementById('brick-container').style.display = 'none';
  document.getElementById('btn-pagar').style.display = 'block';
  document.getElementById('pagamento-status').style.display = 'none';
}

async function iniciarPagamentoBrick(){
  if(!loggedIn){ alert('Faça login para continuar.'); return; }

  const btn = document.getElementById('btn-pagar');
  const statusEl = document.getElementById('pagamento-status');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Carregando...';
  statusEl.style.display = 'none';

  try {
    const isProfessor = userPlano === 'professor' || userDesconto;
    const resp = await fetch(BACKEND_URL + '/pagamento/criar-brick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pacote: pacoteSelecionado,
        usuarioId: userIdBanco,
        email: userEmail || '',
        professor: isProfessor
      })
    });
    const data = await resp.json();

    if(!resp.ok || !data.ok){
      alert(data.erro || 'Erro ao criar pagamento.');
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-lock"></i> Pagar com segurança';
      return;
    }

    // Salvar redação pendente antes de iniciar pagamento
    if(window._redacaoPendente){
      localStorage.setItem('rc_redacao_pendente', JSON.stringify({
        redacao:      window._redacaoPendente.redacao || '',
        imagemBase64: window._redacaoPendente.imagemBase64 || null,
        modoAtivo:    window._redacaoPendente.modoAtivo || 'texto',
        fotoMediaType: window._redacaoPendente.fotoMediaType || 'image/jpeg',
        usuarioId:    userIdBanco,
        ts:           Date.now()
      }));
    }
    salvarSessaoLocal();
    localStorage.setItem('rc_pagamento_em_andamento', JSON.stringify({
      userIdBanco, userEmail, ts: Date.now()
    }));

    // Mostrar container do Brick
    btn.style.display = 'none';
    document.getElementById('brick-container').style.display = 'block';

    // Inicializar MP Bricks
    const mp = new MercadoPago(data.public_key, { locale: 'pt-BR' });
    const bricksBuilder = mp.bricks();

    const pacotes_mp = {
      avulso: 4.90, basico: 19.90, intermediario: 34.90, avancado: 68.60
    };
    const pacotes_prof = {
      avulso: 2.45, basico: 9.95, intermediario: 17.45, avancado: 34.30
    };
    const valorFinal = isProfessor
      ? (pacotes_prof[pacoteSelecionado] || 4.90)
      : (pacotes_mp[pacoteSelecionado] || 4.90);

    _brickController = await bricksBuilder.create('payment', 'cardPaymentBrick_container', {
      initialization: {
        amount: valorFinal,
        preferenceId: data.preference_id,
        payer: { email: userEmail || '' }
      },
      customization: {
        paymentMethods: {
          ticket: 'none',           // remove boleto
          bankTransfer: 'all',      // mantém Pix
          creditCard: 'all',        // mantém cartão de crédito
          debitCard: 'all',         // mantém cartão de débito
          mercadoPago: 'none'       // remove "pagar com conta MP"
        },
        visual: {
          style: {
            theme: 'default',
            customVariables: {
              baseColor: '#C96A3A',
              buttonTextColor: '#FFFFFF'
            }
          }
        }
      },
      callbacks: {
        onReady: () => {
          btn.disabled = false;
          console.log('[brick] pronto');
        },
        onSubmit: async ({ selectedPaymentMethod, formData }) => {
          // Processar pagamento via backend
          try {
            const payResp = await fetch(BACKEND_URL + '/pagamento/processar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...formData,
                usuarioId: userIdBanco,
                pacote: pacoteSelecionado,
                professor: isProfessor
              })
            });
            const payData = await payResp.json();

            if(payData.status === 'approved'){
              fecharBrick();
              // Atualizar saldo
              avaliacoesDisponiveis = payData.avaliacoes_disponiveis || (avaliacoesDisponiveis + 1);
              atualizarSaldo();
              atualizarHeaderUsuario();
              salvarSessaoLocal();
              localStorage.removeItem('rc_pagamento_em_andamento');

              // Processar redação pendente automaticamente
              const pendente = localStorage.getItem('rc_redacao_pendente');
              if(pendente){
                try {
                  const p = JSON.parse(pendente);
                  if(Date.now() - (p.ts||0) < 2*60*60*1000){
                    localStorage.removeItem('rc_redacao_pendente');
                    window._redacaoPendente = {
                      redacao: p.redacao || '',
                      imagemBase64: p.imagemBase64 || null,
                      modoAtivo: p.modoAtivo || 'texto',
                      fotoMediaType: p.fotoMediaType || 'image/jpeg'
                    };
                    goTo('proc');
                    setTimeout(() => confirmarEEnviar(), 300);
                    return;
                  }
                } catch(e){ localStorage.removeItem('rc_redacao_pendente'); }
              }
              goTo('dashboard');
              setTimeout(()=>alert('✅ Pagamento aprovado! Suas avaliações foram creditadas.'), 300);

            } else if(payData.status === 'pending' || payData.status === 'in_process'){
              fecharBrick();
              alert('⏳ Pagamento em processamento. Suas avaliações serão creditadas em breve.');
              goTo('dashboard');
            } else {
              alert('❌ Pagamento não aprovado: ' + (payData.status_detail || 'tente novamente'));
            }
          } catch(e) {
            alert('Erro ao processar pagamento. Tente novamente.');
            console.error('[brick] erro submit:', e);
          }
        },
        onError: (error) => {
          console.error('[brick] erro:', error);
          if(error.cause !== 'null_fields'){
            alert('Erro no formulário de pagamento. Tente novamente.');
            fecharBrick();
            btn.disabled = false;
            btn.style.display = 'block';
            btn.innerHTML = '<i class="ti ti-lock"></i> Pagar com segurança';
          }
        }
      }
    });

  } catch(e) {
    alert('Erro ao carregar pagamento. Tente novamente.');
    btn.disabled = false;
    btn.style.display = 'block';
    btn.innerHTML = '<i class="ti ti-lock"></i> Pagar com segurança';
    console.error('[brick]', e);
  }
}

async function iniciarPagamento(){
  if(!loggedIn){ alert('Faça login para continuar.'); return; }

  const btn = document.getElementById('btn-pagar');
  const status = document.getElementById('pagamento-status');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2"></i> Processando...';
  status.style.display = 'none';

  try {
    const isProfessor = userPlano === 'professor' || userDesconto;
    const resp = await fetch(BACKEND_URL + '/pagamento/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pacote: pacoteSelecionado,
        usuarioId: userIdBanco,
        email: userEmail || '',
        professor: isProfessor
      })
    });
    const data = await resp.json();

    if(!resp.ok || !data.ok){
      alert(data.erro || 'Erro ao criar pagamento.');
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-lock"></i> Pagar com segurança';
      return;
    }

    // Redirecionar para o Mercado Pago
    const url = data.init_point || data.sandbox_init_point;
    if(url){
      status.style.display = 'block';
      status.innerHTML = '<i class="ti ti-external-link"></i> Redirecionando para o Mercado Pago...';
      // Salvar sessão no localStorage (sobrevive a nova aba no Android/iOS/Windows)
      salvarSessaoLocal();
      localStorage.setItem('rc_pagamento_em_andamento', JSON.stringify({
        userIdBanco, userEmail, ts: Date.now()
      }));
      // Salvar redação pendente para processar após retorno
      if(window._redacaoPendente){
        localStorage.setItem('rc_redacao_pendente', JSON.stringify({
          redacao:      window._redacaoPendente.redacao || '',
          imagemBase64: window._redacaoPendente.imagemBase64 || null,
          modoAtivo:    window._redacaoPendente.modoAtivo || 'texto',
          fotoMediaType: window._redacaoPendente.fotoMediaType || 'image/jpeg',
          usuarioId:    userIdBanco,
          ts:           Date.now()
        }));
      }
      setTimeout(() => { window.location.href = url; }, 800);
    } else {
      alert('Link de pagamento não gerado. Tente novamente.');
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-lock"></i> Pagar com segurança';
    }

  } catch(e) {
    alert('Erro de conexão. Tente novamente.');
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-lock"></i> Pagar com segurança';
  }
}

// Verificar retorno do Mercado Pago ao abrir o site
function verificarRetornoPagamento(){
  const params = new URLSearchParams(window.location.search);
  const status = params.get('pagamento');

  if(!status) return;
  window.history.replaceState({}, '', '/');

  // Restaurar sessão do localStorage (funciona em Android/iOS/Windows/nova aba)
  if(!loggedIn){
    try {
      const salvo = localStorage.getItem('rc_usuario');
      if(salvo){
        const s = JSON.parse(salvo);
        if(s.loggedIn && s.userName){
          userNomeCompleto = s.userNomeCompleto || '';
          userName        = s.userName || '';
          userCode        = s.userCode || '';
          userBanca       = s.userBanca || 'ENEM';
          userPlano       = s.userPlano || 'aluno';
          userIdBanco     = s.userIdBanco || null;
          userEmail       = s.userEmail || '';
          userDesconto    = s.userDesconto || false;
          saldoCreditos   = s.saldoCreditos || 0;
          avaliacoesDisponiveis = s.avaliacoesDisponiveis || 0;
          bonusJaUsado    = s.bonusJaUsado || false;
          bonusUsado      = s.bonusUsado || false;
          totalIndicacoesReal = s.totalIndicacoesReal || 0;
          loggedIn = true;
          console.log('[retorno MP] Sessão restaurada:', userName);
        }
      }
    } catch(e){ console.warn('[retorno MP] Erro ao restaurar sessão:', e); }
  }

  // Recuperar usuarioId do pagamento em andamento (fallback extra)
  let pagandoId = null;
  try {
    const pag = JSON.parse(localStorage.getItem('rc_pagamento_em_andamento') || 'null');
    if(pag && pag.userIdBanco) pagandoId = pag.userIdBanco;
    localStorage.removeItem('rc_pagamento_em_andamento');
  } catch(e){}

  const idUsuario = userIdBanco || pagandoId;

  if(status === 'sucesso'){
    setTimeout(async () => {
      // Buscar saldo real do banco
      if(idUsuario){
        try {
          const r = await fetch(BACKEND_URL+'/saldo/'+idUsuario);
          if(r.ok){
            const d = await r.json();
            avaliacoesDisponiveis = d.avaliacoes_disponiveis || 0;
            userIdBanco = userIdBanco || idUsuario;
            loggedIn = loggedIn || !!(userName);
          }
        } catch(e){ console.warn('[retorno MP] Erro saldo:', e); }
        atualizarSaldo();
        atualizarHeaderUsuario();
      }

      // Redação pendente — processar automaticamente sem confirmar
      const pendenteSalvo = localStorage.getItem('rc_redacao_pendente');
      if(pendenteSalvo && idUsuario){
        try {
          const p = JSON.parse(pendenteSalvo);
          const idadeMs = Date.now() - (p.ts || 0);
          if(idadeMs < 2 * 60 * 60 * 1000){
            localStorage.removeItem('rc_redacao_pendente');
            window._redacaoPendente = {
              redacao:       p.redacao || '',
              imagemBase64:  p.imagemBase64 || null,
              modoAtivo:     p.modoAtivo || 'texto',
              fotoMediaType: p.fotoMediaType || 'image/jpeg'
            };
            goTo('proc');
            setTimeout(() => confirmarEEnviar(), 500);
            return;
          } else {
            localStorage.removeItem('rc_redacao_pendente');
          }
        } catch(e){
          localStorage.removeItem('rc_redacao_pendente');
        }
      }

      if(loggedIn){
        goTo('dashboard');
        setTimeout(()=>alert('✅ Pagamento aprovado! Suas avaliações foram creditadas.'), 300);
      } else {
        alert('✅ Pagamento aprovado! Faça login para acessar suas avaliações.');
        goTo('login');
      }
    }, 800);
  } else if(status === 'falhou'){
    localStorage.removeItem('rc_redacao_pendente');
    localStorage.removeItem('rc_pagamento_em_andamento');
    setTimeout(() => {
      alert('Pagamento não aprovado. Tente novamente ou escolha outra forma de pagamento.');
      if(loggedIn) goTo('creditos'); else goTo('login');
    }, 500);
  } else if(status === 'pendente'){
    setTimeout(() => {
      alert('Pagamento pendente. Quando aprovado, suas avaliações serão creditadas automaticamente.');
      if(loggedIn) goTo('dashboard'); else goTo('login');
    }, 500);
  }
}

// ── DETECÇÃO DE REDAÇÃO DUPLICADA ────────────────────────────────────
let hashesEnviados = [];

function hashTexto(texto){
  // Hash simples baseado em comprimento + primeiras/últimas palavras
  const palavras = texto.trim().split(/\s+/).filter(w => w.length > 3);
  const amostra = [
    palavras.slice(0, 5).join(''),
    palavras.slice(-5).join(''),
    String(palavras.length)
  ].join('|');
  // Hash numérico simples
  let h = 0;
  for(let i = 0; i < amostra.length; i++){
    h = ((h << 5) - h) + amostra.charCodeAt(i);
    h |= 0;
  }
  return String(Math.abs(h));
}

function verificarDuplicata(texto){
  const hash = hashTexto(texto);
  // Carregar hashes salvos na sessão
  try {
    const salvos = JSON.parse(sessionStorage.getItem('rc_hashes') || '[]');
    hashesEnviados = [...new Set([...hashesEnviados, ...salvos])];
  } catch(e){}
  if(hashesEnviados.includes(hash)) return true;
  hashesEnviados.push(hash);
  // Persistir no sessionStorage
  try { sessionStorage.setItem('rc_hashes', JSON.stringify(hashesEnviados.slice(-50))); } catch(e){}
  return false;
}

// ── LIMPEZA CENTRALIZADA DE UPLOADS ──────────────────────────────────
function limparTodosUploads(){
  // Variáveis de upload
  fotoBase64 = null;
  fotoMediaType = 'image/jpeg';
  arquivoTexto = null;
  // Inputs de arquivo
  const inputFoto = document.getElementById('input-foto');
  if(inputFoto) inputFoto.value = '';
  const inputArquivo = document.getElementById('input-arquivo');
  if(inputArquivo) inputArquivo.value = '';
  // Previews visuais
  const fotoPreview = document.getElementById('foto-preview');
  if(fotoPreview) fotoPreview.style.display = 'none';
  const arquivoPreview = document.getElementById('arquivo-preview');
  if(arquivoPreview) arquivoPreview.style.display = 'none';
  // Textarea
  const textarea = document.getElementById('redacao-texto');
  if(textarea) textarea.value = '';
  // NÃO limpar resultadoIA aqui — só limpar ao iniciar novo envio
}
let fotoBase64 = null;
let fotoMediaType = 'image/jpeg';
let arquivoTexto = null;

function fotoSelecionada(input){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 20 * 1024 * 1024){ alert('Foto muito grande. Máximo 20MB.'); return; }

  fotoMediaType = file.type || 'image/jpeg';

  // Redimensionar para máx 1600px e qualidade 0.85 antes de enviar
  const reader = new FileReader();
  reader.onload = function(e){
    const img = new Image();
    img.onload = function(){
      const MAX = 1600;
      let w = img.width, h = img.height;
      if(w > MAX || h > MAX){
        if(w > h){ h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      fotoBase64 = dataUrl.split(',')[1];
      fotoMediaType = 'image/jpeg';

      document.getElementById('foto-img').src = dataUrl;
      document.getElementById('foto-nome').textContent =
        file.name + ' → ' + w + '×' + h + 'px (' + (fotoBase64.length/1024).toFixed(0) + 'KB base64)';
      document.getElementById('foto-preview').style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function arquivoSelecionado(input){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 10 * 1024 * 1024){ alert('Arquivo muito grande. Máximo 10MB.'); return; }

  document.getElementById('arquivo-nome').textContent = file.name;
  document.getElementById('arquivo-tamanho').textContent = (file.size/1024).toFixed(0) + 'KB — extraindo texto...';
  document.getElementById('arquivo-preview').style.display = 'block';

  const ext = file.name.split('.').pop().toLowerCase();

  if(ext === 'pdf'){
    try {
      await carregarPdfJs(); // carregar sob demanda
      // Configurar worker do pdfjs
      if(typeof pdfjsLib !== 'undefined'){
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textoCompleto = '';

        for(let i = 1; i <= pdfDoc.numPages; i++){
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const textoPage = content.items.map(item => item.str).join(' ');
          textoCompleto += textoPage + '\n';
        }

        textoCompleto = textoCompleto.trim();

        if(textoCompleto.length > 50){
          // PDF com texto selecionável — extraiu com sucesso
          arquivoTexto = textoCompleto;
          fotoBase64 = null;
          document.getElementById('arquivo-tamanho').textContent =
            (file.size/1024).toFixed(0) + 'KB — ' +
            textoCompleto.split(/\s+/).filter(w=>w).length + ' palavras extraídas';
        } else {
          // PDF escaneado — enviar como imagem
          const reader = new FileReader();
          reader.onload = e => {
            fotoBase64 = e.target.result.split(',')[1];
            fotoMediaType = 'application/pdf';
            arquivoTexto = null;
            document.getElementById('arquivo-tamanho').textContent =
              (file.size/1024).toFixed(0) + 'KB — PDF escaneado, será lido pela IA';
          };
          reader.readAsDataURL(file);
        }
      } else {
        // pdfjs não carregou — fallback para base64
        const reader = new FileReader();
        reader.onload = e => {
          fotoBase64 = e.target.result.split(',')[1];
          fotoMediaType = 'application/pdf';
          arquivoTexto = null;
          document.getElementById('arquivo-tamanho').textContent =
            (file.size/1024).toFixed(0) + 'KB — pronto para avaliação';
        };
        reader.readAsDataURL(file);
      }
    } catch(err) {
      console.error('Erro ao ler PDF:', err);
      alert('Não foi possível ler o PDF. Tente copiar o texto e usar o modo Digitar.');
      arquivoTexto = null;
    }
  } else {
    alert('Formato não suportado. Use PDF, ou copie o texto e use o modo Digitar.');
    arquivoTexto = null;
    input.value = '';
    document.getElementById('arquivo-preview').style.display = 'none';
  }
}

// ── HISTÓRICO REAL DO BANCO ───────────────────────────────────────────
// avaliacaoAtualId declarado no bloco global acima

async function carregarHistorico(destino){
  if(!loggedIn || !userCode) return;
  const usuario = userNomeCompleto || userName;
  if(!usuario) return;

  if(destino === 'hist'){
    document.getElementById('hist-loading').style.display = 'block';
    document.getElementById('hist-lista').innerHTML = '';
    document.getElementById('hist-vazio').style.display = 'none';
    document.getElementById('hist-evol').style.display = 'none';
  } else {
    document.getElementById('dash-recent-lista').innerHTML =
      '<div style="text-align:center;padding:20px 0;color:#D5CFC7;font-size:13px"><i class="ti ti-loader-2" style="font-size:20px;display:block;margin-bottom:6px;animation:spin 1.5s linear infinite"></i>Carregando...</div>';
  }

  try {
    const resp = await fetch(BACKEND_URL + '/historico/' + encodeURIComponent(usuario));
    const data = await resp.json();
    const lista = data.avaliacoes || [];

    if(destino === 'hist'){
      document.getElementById('hist-loading').style.display = 'none';
      if(!lista.length){
        document.getElementById('hist-vazio').style.display = 'block';
        return;
      }
      document.getElementById('hist-lista').innerHTML = lista.map(av => {
        const nota = av.nota_geral;
        const scoreClass = nota >= 800 ? 'high' : nota >= 600 ? 'mid' : 'low';
        const data = new Date(av.created_at).toLocaleDateString('pt-BR');
        const preview = av.redacao_preview ? av.redacao_preview.substring(0, 50) + '...' : 'Redação avaliada';
        return `<div class="history-item" onclick="abrirAvaliacao(${av.id})">
          <div class="hist-score ${scoreClass}">${nota}</div>
          <div style="flex:1">
            <div class="hist-tema">${preview}</div>
            <div class="hist-meta">${av.banca.replace('_',' ')} • ${data}</div>
          </div>
          <i class="ti ti-chevron-right" style="color:#D5CFC7"></i>
        </div>`;
      }).join('');
      // Evolução
      if(lista.length >= 2){
        const notas = lista.map(a => a.nota_geral);
        const ultima = notas[0], penultima = notas[1];
        const delta = ultima - penultima;
        document.getElementById('hist-evol').style.display = 'block';
        document.getElementById('hist-evol-num').textContent = penultima + ' → ' + ultima;
        document.getElementById('hist-evol-delta').textContent =
          (delta >= 0 ? '+' : '') + delta + ' pontos na última avaliação ' + (delta >= 0 ? '↑' : '↓');
        document.getElementById('hist-evol-delta').style.color = delta >= 0 ? '#16A34A' : '#EA580C';
      }
    } else {
      // Dashboard — mostra apenas as 2 mais recentes
      if(!lista.length){
        document.getElementById('dash-recent-lista').innerHTML =
          '<div style="text-align:center;padding:20px 0;color:#9B9080;font-size:13px"><i class="ti ti-history" style="font-size:22px;display:block;margin-bottom:6px;color:#D5CFC7"></i>Nenhuma avaliação ainda.<br>Envie sua primeira redação!</div>';
        return;
      }
      const recentes = lista.slice(0, 2);
      document.getElementById('dash-recent-lista').innerHTML = recentes.map(av => {
        const nota = av.nota_geral;
        const scoreClass = nota >= 800 ? 'high' : nota >= 600 ? 'mid' : 'low';
        const data = new Date(av.created_at).toLocaleDateString('pt-BR');
        const preview = av.redacao_preview ? av.redacao_preview.substring(0, 45) + '...' : 'Redação avaliada';
        return `<div class="dash-recent-item" onclick="abrirAvaliacao(${av.id})">
          <div class="dash-recent-score ${scoreClass}">${nota}</div>
          <div style="flex:1">
            <div class="dash-recent-tema">${preview}</div>
            <div class="dash-recent-meta">${av.banca.replace('_',' ')} • ${data}</div>
          </div>
          <i class="ti ti-chevron-right" style="color:#D5CFC7"></i>
        </div>`;
      }).join('');
      // Evolução no dashboard
      if(lista.length >= 2){
        const delta = lista[0].nota_geral - lista[1].nota_geral;
        document.getElementById('dash-evol-block').style.display = 'block';
        document.getElementById('dash-evol-num').textContent = lista[1].nota_geral + ' → ' + lista[0].nota_geral;
        document.getElementById('dash-evol-delta').textContent =
          (delta >= 0 ? '+' : '') + delta + ' pontos na última avaliação ' + (delta >= 0 ? '↑' : '↓');
        document.getElementById('dash-evol-delta').style.color = delta >= 0 ? '#16A34A' : '#EA580C';
      }
    }
  } catch(e){
    if(destino === 'hist'){
      document.getElementById('hist-loading').style.display = 'none';
      document.getElementById('hist-lista').innerHTML =
        '<div style="text-align:center;padding:20px;color:#9B9080;font-size:13px">Não foi possível carregar o histórico.</div>';
    } else {
      document.getElementById('dash-recent-lista').innerHTML =
        '<div style="text-align:center;padding:16px;color:#9B9080;font-size:12px">Histórico indisponível no momento.</div>';
    }
  }
}

async function abrirAvaliacao(id){
  avaliacaoAtualId = id;
  goTo('proc'); // mostra tela de carregamento
  try {
    const resp = await fetch(BACKEND_URL + '/avaliacao/' + id);
    const row = await resp.json();
    if(row.resultado){
      resultadoIA = typeof row.resultado === 'string' ? JSON.parse(row.resultado) : row.resultado;
      preencherResultado(resultadoIA);
    }
    goTo('result');
  } catch(e){
    goTo('result'); // mostra resultado estático como fallback
  }
}



// Alias para chamada após retorno do pagamento
function processarAvaliacao(){ confirmarEEnviar(); }

async function confirmarEEnviar(){
  const pendente = window._redacaoPendente;
  if(!pendente){ goTo('enviar'); return; }

  const { redacao, imagemBase64, fotoMediaType: mimeType } = pendente;
  window._redacaoPendente = null;

  // Debitar localmente (banco debita no /avaliar)
  avaliacoesDisponiveis = Math.max(0, avaliacoesDisponiveis - 1);
  if(avaliacoesDisponiveis === 0) bonusJaUsado = true;
  bonusUsado = true;
  resultadoIA = null;
  document.getElementById('bonus-chip').style.display='none';
  document.getElementById('dash-bonus').style.display='none';
  goTo('proc');

  const bar = document.querySelector('.progress-bar');
  if(bar){ bar.style.animation='none'; bar.offsetHeight; bar.style.animation='prog 20s ease-in-out forwards'; }

  const banca = userBanca || 'ENEM';

  try {
    const payload = {
      redacao,
      banca,
      usuario: userNomeCompleto || userName || 'Visitante',
      usuarioId: userIdBanco || null
    };
    if(imagemBase64){
      payload.imagem = imagemBase64;
      // Usar o mimeType salvo no objeto pendente (capturado antes da confirmação)
      payload.mediaType = mimeType || 'image/jpeg';
    }

    console.log('Enviando para:', BACKEND_URL+'/avaliar', '| mime:', payload.mediaType);
    const _ctrl = new AbortController();
    const _timeout = setTimeout(() => _ctrl.abort(), 90000); // timeout 90s
    const resp = await fetch(BACKEND_URL+'/avaliar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: _ctrl.signal
    });
    clearTimeout(_timeout);

    console.log('Status resposta:', resp.status);
    const data = await resp.json();
    console.log('Resposta backend:', data);

    if(data.formato === 'json' && data.avaliacao && typeof data.avaliacao === 'object'){
      resultadoIA = data.avaliacao;
      if(resultadoIA.comentarioGeral){
        resultadoIA.comentarioGeral = resultadoIA.comentarioGeral
          .replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim();
      }
      preencherResultado(resultadoIA);
    } else if(data.avaliacao){
      const raw = typeof data.avaliacao === 'string' ? data.avaliacao : JSON.stringify(data.avaliacao);
      try {
        let limpo = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```\s*$/i,'').trim();
        const start = limpo.indexOf('{'); const end = limpo.lastIndexOf('}');
        if(start >= 0 && end > start) limpo = limpo.substring(start, end+1);
        resultadoIA = JSON.parse(limpo);
        if(resultadoIA.comentarioGeral)
          resultadoIA.comentarioGeral = resultadoIA.comentarioGeral.replace(/```[\s\S]*?```/g,'').trim();
        preencherResultado(resultadoIA);
      } catch {
        document.getElementById('comentario-geral-text').textContent = raw;
      }
    } else if(data.erro){
      alert('Erro na avaliação: ' + data.erro);
      goTo('enviar');
      return;
    }
  } catch(e) {
    console.error('Erro de rede:', e);
    alert('Não foi possível conectar ao servidor. Tente novamente.');
    goTo('enviar');
    return;
  }

  totalRedacoes++;
  atualizarSaldo();
  fotoBase64 = null; arquivoTexto = null;
  goTo('result');
}

async function enviar(){
  // Determinar modo ativo
  const modoAtivo = document.querySelector('.mode-btn.selected')?.textContent?.trim() || 'Digitar';
  let redacao = '';
  let imagemBase64 = null;

  if(modoAtivo.includes('Digitar')){
    redacao = document.getElementById('redacao-texto')?.value || '';
    if(!redacao || redacao.trim().length < 50){
      alert('Digite sua redação antes de enviar (mínimo 50 caracteres).');
      return;
    }
    // Verificar duplicata
    if(verificarDuplicata(redacao)){
      const continuar = confirm('⚠️ Esta redação já foi avaliada anteriormente nesta sessão.\n\nEnviar novamente pode gerar resultados diferentes e criar inconsistência no seu histórico.\n\nDeseja continuar mesmo assim?');
      if(!continuar) return;
    }
  } else if(modoAtivo.includes('Foto')){
    if(!fotoBase64){ alert('Selecione uma foto da redação antes de enviar.'); return; }
    imagemBase64 = fotoBase64;
    redacao = 'Redação enviada via foto — analisar imagem anexada.';
  } else if(modoAtivo.includes('Arquivo')){
    if(fotoBase64 && fotoMediaType === 'application/pdf'){
      // PDF enviado como base64
      imagemBase64 = fotoBase64;
      redacao = 'Redação enviada via PDF — analisar documento anexado.';
    } else if(arquivoTexto){
      redacao = arquivoTexto;
      if(redacao.trim().length < 50){ alert('Arquivo muito curto ou não lido corretamente.'); return; }
    } else {
      alert('Selecione um arquivo antes de enviar.');
      return;
    }
  }

  // ── MOSTRAR TELA DE CONFIRMAÇÃO DE SALDO ────────────────────────
  const disponiveis = avaliacoesDisponiveis || 0;
  // Bônus = qualquer avaliação disponível (banco é a fonte da verdade)
  const ehBonus = (disponiveis > 0 && !bonusJaUsado);

  if(disponiveis <= 0){
    // Saldo zero — ir direto para pagamento
    const irPagar = confirm(`⚠️ Saldo insuficiente\n\n${userName || 'Olá'}, você não possui avaliações disponíveis.\n\nDeseja adquirir um pacote agora?`);
    if(irPagar) goTo('creditos');
    return;
  }

  // Mostrar tela de confirmação
  const qtdEl = document.getElementById('confirm-saldo-qtd');
  const custoEl = document.getElementById('confirm-custo');
  const restanteEl = document.getElementById('confirm-saldo-restante');
  if(qtdEl) qtdEl.textContent = String(disponiveis);
  if(custoEl) custoEl.textContent = '1 avaliação (R$ ' + (userDesconto ? '2,45' : '4,90') + ')';
  if(restanteEl) restanteEl.textContent = String(disponiveis - 1) + ' avaliação(ões)';

  // Guardar dados para processar após confirmação
  window._redacaoPendente = { redacao, imagemBase64, modoAtivo, fotoMediaType: fotoMediaType || 'image/jpeg' };
  goTo('confirmar-saldo');
}

// ── Preencher resultado com dados reais da IA ──────────────────
function preencherResultado(r){
  if(!r) return;

  // Nota geral e nível
  if(r.notaGeral !== undefined){
    const notaEl = document.getElementById('result-nota');
    if(notaEl) notaEl.textContent = r.notaGeral;
  }
  if(r.nivel){
    const nivelEl = document.getElementById('result-nivel');
    if(nivelEl) nivelEl.textContent = r.nivel;
  }

  // Label da banca
  const labelBanca = document.getElementById('result-banca-label');
  if(labelBanca && r.banca) labelBanca.textContent = r.banca.replace('_',' ') + ' 2025';

  // Barras de competência
  if(r.competencias && r.competencias.length){
    r.competencias.forEach((c, i) => {
      const row = document.querySelectorAll('.comp-row')[i];
      if(!row) return;
      const fill = row.querySelector('.comp-fill');
      const val  = row.querySelector('.comp-val');
      if(fill) fill.style.width = c.percentual + '%';
      if(val)  val.textContent  = c.nota + '/' + c.notaMaxima;
      // Cor por desempenho
      if(fill){
        if(c.percentual >= 80) fill.style.background = '#16A34A';
        else if(c.percentual >= 60) fill.style.background = '#C96A3A';
        else fill.style.background = '#EA580C';
      }
    });
  }

  // Análise por parágrafo
  if(r.paragrafos && r.paragrafos.length){
    const container = document.getElementById('paragrafos-container');
    if(container){
      container.innerHTML = r.paragrafos.map(p => {
        const badgeClass = p.classificacao === 'BOM' ? 'bom' : p.classificacao === 'REGULAR' ? 'regular' : 'atencao';
        return `
        <div class="paragrafo-block">
          <div class="paragrafo-header" onclick="toggleParagrafo(this)">
            <div class="paragrafo-titulo">§${p.numero} — ${p.titulo}</div>
            <span class="paragrafo-badge ${badgeClass}">${p.classificacao}</span>
          </div>
          <div class="paragrafo-body">
            <div class="paragrafo-texto">${p.texto_trecho ? '"' + p.texto_trecho + '..."' : ''}</div>
            <div class="paragrafo-analise">
              <strong>Recursos coesivos:</strong> ${p.recursosCoesivos}<br><br>
              <strong>Estrutura argumentativa:</strong> ${p.estruturaArgumentativa}
              ${p.desvios && p.desvios !== 'Nenhum desvio identificado' ? '<br><br><strong>⚠ Desvios:</strong> ' + p.desvios : ''}
              ${p.sugestao ? '<br><br><strong>💡 Sugestão:</strong> ' + p.sugestao : ''}
            </div>
            ${p.referencia ? '<div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> ' + p.referencia + '</div>' : ''}
          </div>
        </div>`;
      }).join('');
    }
  }

  // Pontos fortes
  if(r.pontosFortes && r.pontosFortes.length){
    const pfContainer = document.getElementById('pontos-fortes-container');
    if(pfContainer){
      pfContainer.innerHTML = r.pontosFortes.map(pf => `
        <div class="result-block green">
          <div class="result-tag green">ponto forte</div>
          <div class="result-text">${pf.descricao}</div>
          ${pf.referencia ? '<div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> ' + pf.referencia + '</div>' : ''}
        </div>`).join('');
    }
  }

  // Desvios identificados
  if(r.desviosIdentificados && r.desviosIdentificados.length){
    const dvContainer = document.getElementById('desvios-container');
    if(dvContainer){
      dvContainer.innerHTML = r.desviosIdentificados.map(d => {
        const tagClass = d.eixo.includes('CRASE') || d.eixo.includes('REGÊNCIA') ? 'orange' : 'yellow';
        return `
        <div class="result-block ${tagClass}">
          <div class="result-tag ${tagClass}">${d.eixo}</div>
          <div class="result-text">
            ${d.trecho ? '<em>"' + d.trecho + '"</em> → ' : ''}
            ${d.correcao ? '<strong>' + d.correcao + '</strong>. ' : ''}
            ${d.explicacao}
          </div>
          ${d.referencia ? '<div class="result-ref"><i class="ti ti-book-2" style="font-size:11px"></i> ' + d.referencia + '</div>' : ''}
        </div>`;
      }).join('');
    }
  }

  // Comentário geral
  if(r.comentarioGeral){
    const cgEl = document.getElementById('comentario-geral-text');
    if(cgEl) cgEl.textContent = r.comentarioGeral;
  }
}

function rate(n){rating=n;document.querySelectorAll('.star').forEach((s,i)=>s.classList.toggle('active',i<n));}
function enviarFeedback(){
  if(!rating){alert('Selecione uma nota.');return;}
  const r={5:'Que alegria! Continue escrevendo.',4:'Obrigado! Continuamos melhorando.',3:'Agradecemos o feedback.',2:'Vamos melhorar.',1:'Seu comentário será analisado com atenção.'};
  document.getElementById('feedback-reply-text').textContent=r[rating];
  document.getElementById('feedback-reply').style.display='block';
  const comentarioEl = document.getElementById('feedback-text');
  fetch(BACKEND_URL + '/log/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: userNomeCompleto || userName || 'Visitante',
      nota: rating,
      comentario: comentarioEl ? comentarioEl.value : '',
      banca: userBanca || 'ENEM',
      notaRedacao: resultadoIA ? resultadoIA.notaGeral : 0
    })
  }).catch(()=>{});
}

// ── PLANO PROFESSOR ───────────────────────────────────────────────────
function selecionarPlano(plano){
  userPlano = plano;
  document.getElementById('plano-aluno').classList.toggle('selected', plano==='aluno');
  document.getElementById('plano-professor').classList.toggle('selected', plano==='professor');
  document.getElementById('beneficios-professor').style.display = plano==='professor' ? 'block' : 'none';
}

function avancarPlano(){
  if(userPlano === 'professor'){
    goTo('professor-cadastro');
  } else {
    concluirPerfil();
  }
}

// Upload da CND
function cndSelecionado(input){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 5 * 1024 * 1024){
    alert('Arquivo muito grande. Máximo 5MB.');
    return;
  }
  const area = document.getElementById('upload-area');
  const nome = document.getElementById('cnd-nome');
  area.classList.add('has-file');
  nome.textContent = file.name;
  nome.style.display = 'block';
  area.querySelector('.upload-cnd-titulo').textContent = 'Documento selecionado ✓';
}

async function enviarCadastroProfessor(){
  const nivel = document.getElementById('prof-nivel').value;
  const disciplina = document.getElementById('prof-disciplina').value.trim();
  const instituicao = document.getElementById('prof-instituicao').value.trim();
  const cndFile = document.getElementById('cnd-file').files[0];

  if(!nivel){ alert('Selecione o nível de ensino.'); return; }
  if(!disciplina){ alert('Informe a disciplina.'); return; }
  if(!instituicao){ alert('Informe a instituição.'); return; }
  if(!cndFile){ alert('Envie o documento comprobatório (CND, declaração ou contracheque).'); return; }

  const btn = document.querySelector('#screen-professor-cadastro .btn-primary');
  if(btn){ btn.disabled=true; btn.textContent='Enviando...'; }

  try {
    // Converter arquivo para base64
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = () => rej(new Error('Erro ao ler arquivo'));
      r.readAsDataURL(cndFile);
    });

    // Detectar tipo de documento selecionado
    const tipoDocRadio = document.querySelector('input[name="tipo-doc"]:checked');
    const tipoDoc = tipoDocRadio ? tipoDocRadio.value : 'CND';

    const resp = await fetch(BACKEND_URL + '/professor/solicitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuarioId: userIdBanco,
        usuarioNome: userNomeCompleto || userName,
        usuarioEmail: userEmail,
        tipoDocumento: tipoDoc,
        arquivoNome: cndFile.name,
        arquivoBase64: base64,
        arquivoMime: cndFile.type || 'application/pdf',
        nivel, disciplina, instituicao
      })
    });

    const data = await resp.json();
    if(!resp.ok){
      alert(data.erro || 'Erro ao enviar solicitação.');
      if(btn){ btn.disabled=false; btn.innerHTML='Enviar solicitação <i class="ti ti-send"></i>'; }
      return;
    }

    professorVerificado = false;
    if(btn){ btn.disabled=false; btn.innerHTML='Enviar solicitação <i class="ti ti-send"></i>'; }
    goTo('professor-pendente');

  } catch(e) {
    alert('Erro ao enviar. Tente novamente.');
    if(btn){ btn.disabled=false; btn.innerHTML='Enviar solicitação <i class="ti ti-send"></i>'; }
  }
}

// Vincular aluno
function vincularAluno(){
  const input = document.getElementById('vincular-input');
  const codigo = input.value.trim().toUpperCase();
  if(codigo.length < 4){ alert('Código inválido.'); return; }
  if(alunosVinculados.find(a => a.codigo === codigo)){
    alert('Este aluno já está vinculado.');
    return;
  }
  alunosVinculados.push({ codigo, data: new Date().toLocaleDateString('pt-BR') });
  input.value = '';
  renderizarAlunos();
  atualizarPainelProfessor();
}

function removerAluno(codigo){
  alunosVinculados = alunosVinculados.filter(a => a.codigo !== codigo);
  renderizarAlunos();
  atualizarPainelProfessor();
}

function renderizarAlunos(){
  const lista = document.getElementById('alunos-lista');
  if(!lista) return;
  if(!alunosVinculados.length){
    lista.innerHTML = '<div style="text-align:center;padding:20px;color:#D5CFC7;font-size:13px"><i class="ti ti-users" style="font-size:24px;display:block;margin-bottom:8px"></i>Nenhum aluno vinculado ainda.</div>';
    return;
  }
  lista.innerHTML = alunosVinculados.map(a => `
    <div class="aluno-item">
      <div>
        <div class="aluno-codigo">${a.codigo}</div>
        <div class="aluno-data">Vinculado em ${a.data}</div>
      </div>
      <button class="aluno-remover" onclick="removerAluno('${a.codigo}')"><i class="ti ti-x"></i></button>
    </div>`).join('');
}

function atualizarPainelProfessor(){
  const usadas = document.getElementById('prof-usadas');
  const restantes = document.getElementById('prof-restantes');
  const count = document.getElementById('prof-alunos-count');
  const pct = document.getElementById('prof-barra-pct');
  const fill = document.getElementById('prof-barra-fill');
  const display = document.getElementById('prof-codigo-display');

  if(usadas) usadas.textContent = professorRedacoesUsadas;
  if(restantes) restantes.textContent = professorRedacoesTotal - professorRedacoesUsadas;
  if(count) count.textContent = alunosVinculados.length;
  const p = Math.round((professorRedacoesUsadas / professorRedacoesTotal) * 100);
  if(pct) pct.textContent = p + '%';
  if(fill) fill.style.width = p + '%';
  if(display && userCode) display.textContent = 'PROF-' + userCode;
}

function copiarCodigoProfessor(){
  const codigo = 'PROF-' + userCode;
  navigator.clipboard.writeText(codigo).then(()=>{
    alert('Código copiado: ' + codigo);
  }).catch(()=>{
    alert('Código: ' + codigo);
  });
}
</script>

<!-- ═══════════════════════════════════════════════════════════
     REDA — Assistente IA do RedaCheck
     ═══════════════════════════════════════════════════════════ -->
<style>
/* Botão flutuante */
.reda-fab {
  position: fixed;
  bottom: 24px;
  right: 20px;
  width: 52px;
  height: 52px;
  background: #1A1A1A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  transition: transform 0.2s, background 0.2s;
  border: none;
}
.reda-fab:hover { transform: scale(1.08); background: #C96A3A; }
.reda-fab svg { width: 24px; height: 24px; fill: white; }
.reda-fab-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  background: #C96A3A;
  border-radius: 50%;
  border: 2px solid #FAF9F7;
  display: none;
}
.reda-fab-badge.show { display: block; }

/* Painel do chat */
.reda-panel {
  position: fixed;
  bottom: 88px;
  right: 16px;
  width: calc(100vw - 32px);
  max-width: 380px;
  height: 520px;
  background: #FAF9F7;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  z-index: 999;
  overflow: hidden;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
}
.reda-panel.open {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: all;
}

/* Header do chat */
.reda-header {
  background: #1A1A1A;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.reda-avatar {
  width: 36px;
  height: 36px;
  background: #C96A3A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.reda-header-info { flex: 1; }
.reda-header-nome { font-size: 14px; font-weight: 600; color: white; }
.reda-header-status { font-size: 11px; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 4px; }
.reda-header-status::before { content: ''; width: 6px; height: 6px; background: #16A34A; border-radius: 50%; display: inline-block; }
.reda-close { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 20px; padding: 0; line-height: 1; }
.reda-close:hover { color: white; }

/* Área de mensagens */
.reda-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.reda-msgs::-webkit-scrollbar { width: 4px; }
.reda-msgs::-webkit-scrollbar-track { background: transparent; }
.reda-msgs::-webkit-scrollbar-thumb { background: #E5E0D8; border-radius: 2px; }

/* Mensagens */
.reda-msg {
  max-width: 85%;
  font-size: 13px;
  line-height: 1.6;
  padding: 10px 13px;
  border-radius: 16px;
  animation: msgIn 0.2s ease;
}
@keyframes msgIn { from { opacity:0; transform: translateY(6px); } to { opacity:1; transform: translateY(0); } }
.reda-msg.bot {
  background: #FFFFFF;
  border: 1px solid #E5E0D8;
  color: #1A1A1A;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.reda-msg.user {
  background: #1A1A1A;
  color: #FAF9F7;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.reda-typing {
  align-self: flex-start;
  background: #FFFFFF;
  border: 1px solid #E5E0D8;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  padding: 12px 16px;
  display: none;
}
.reda-typing.show { display: flex; gap: 4px; align-items: center; }
.reda-dot {
  width: 6px; height: 6px;
  background: #9B9080;
  border-radius: 50%;
  animation: redaDot 1.2s infinite;
}
.reda-dot:nth-child(2) { animation-delay: 0.2s; }
.reda-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes redaDot { 0%,80%,100% { transform: scale(0.7); opacity:0.4; } 40% { transform: scale(1); opacity:1; } }

/* Sugestões rápidas */
.reda-sugestoes {
  padding: 0 14px 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.reda-sugestao {
  background: #F5F2EE;
  border: 1px solid #E5E0D8;
  border-radius: 20px;
  padding: 5px 11px;
  font-size: 11px;
  color: #6B6255;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
}
.reda-sugestao:hover { background: #FEF3EC; border-color: #F9D4BE; color: #C96A3A; }

/* Input */
.reda-input-row {
  padding: 10px 12px;
  border-top: 1px solid #EEEBE6;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-shrink: 0;
  background: #FAF9F7;
}
.reda-input {
  flex: 1;
  border: 1px solid #E5E0D8;
  border-radius: 20px;
  padding: 9px 14px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;
  background: #FFFFFF;
  color: #1A1A1A;
  max-height: 100px;
  overflow-y: auto;
  line-height: 1.4;
}
.reda-input:focus { border-color: #C96A3A; }
.reda-send {
  width: 36px;
  height: 36px;
  background: #1A1A1A;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.reda-send:hover { background: #C96A3A; }
.reda-send svg { width: 16px; height: 16px; fill: white; }
</style>

<!-- Botão flutuante -->
<button class="reda-fab" onclick="toggleReda()" id="reda-fab" title="Falar com a Reda">
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.1 21.1a.75.75 0 0 0 .938.938l3.932-1.338A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2ZM8 11h8a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2Zm0-3h5a1 1 0 0 1 0 2H8a1 1 0 0 1 0-2Zm0 6h6a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2Z"/></svg>
  <div class="reda-fab-badge" id="reda-badge"></div>
</button>

<!-- Painel do chat -->
<div class="reda-panel" id="reda-panel">
  <div class="reda-header">
    <div class="reda-avatar">R</div>
    <div class="reda-header-info">
      <div class="reda-header-nome">Reda</div>
      <div class="reda-header-status">Assistente RedaCheck</div>
    </div>
    <button class="reda-close" onclick="toggleReda()">×</button>
  </div>

  <div class="reda-msgs" id="reda-msgs">
    <!-- Mensagens aparecem aqui -->
  </div>

  <div class="reda-typing" id="reda-typing">
    <div class="reda-dot"></div>
    <div class="reda-dot"></div>
    <div class="reda-dot"></div>
  </div>

  <div class="reda-sugestoes" id="reda-sugestoes">
    <button class="reda-sugestao" onclick="redaEnviarSugestao(this)">Como funciona?</button>
    <button class="reda-sugestao" onclick="redaEnviarSugestao(this)">O que é a C5?</button>
    <button class="reda-sugestao" onclick="redaEnviarSugestao(this)">Como melhorar minha nota?</button>
    <button class="reda-sugestao" onclick="redaEnviarSugestao(this)">Quais bancas vocês avaliam?</button>
  </div>

  <div class="reda-input-row">
    <textarea class="reda-input" id="reda-input" placeholder="Digite sua dúvida..." rows="1"
      onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();redaEnviar();}"></textarea>
    <button class="reda-send" onclick="redaEnviar()">
      <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    </button>
  </div>
</div>

<script>
// ── REDA — Assistente IA ──────────────────────────────────────────────
const REDA_SISTEMA = `Você é a Reda, assistente virtual do RedaCheck — a plataforma brasileira de avaliação inteligente de redações. Você é amigável, pedagógica, direta e especialista em redações dissertativas-argumentativas.

SOBRE O REDACHECK:
- Plataforma de avaliação de redações com IA, fundamentada nas gramáticas de Cegalla e Celso Cunha & Cintra
- Avalia redações para ENEM, ITA, Unicamp, Fuvest/USP e Concurso Público
- Cada avaliação custa R$ 4,90 (desconto progressivo: R$ 3,90 com saldo acima de R$ 200; R$ 2,90 acima de R$ 500)
- Há 1 redação bônus gratuita para novos cadastros
- Programa de indicação: a cada 10 amigos indicados, ganha 1 redação bônus
- Site: redacheck.com.br

CRITÉRIOS ENEM — 5 COMPETÊNCIAS (Cartilha 2025):
C1 — Domínio da modalidade escrita formal da Língua Portuguesa (0–200)
C2 — Compreensão da proposta e repertório sociocultural produtivo (0–200)
C3 — Seleção e organização de argumentos em defesa de um ponto de vista (0–200)
C4 — Mecanismos linguísticos de coesão textual (0–200)
C5 — Proposta de intervenção com respeito aos direitos humanos (0–200)
  → C5 exige obrigatoriamente 5 elementos: agente + ação + modo/meio + finalidade + efeito esperado
  → Proposta vaga ou sem os 5 elementos = nota penalizada
  → Desrespeito aos direitos humanos = nota 0 na C5

BANCAS SUPORTADAS:
- ENEM: 5 competências, 0–1000 pontos
- ITA: 4 critérios (desenvolvimento, argumentação, língua, coesão), 0–1000
- Unicamp: 3 critérios (proposta temática, gênero discursivo, norma culta), 0–12
- Fuvest/USP: 4 quesitos (proposta, desenvolvimento, língua, coesão), 0–100
- Concurso Público: avaliação por CESPE, FGV, FCC e outras bancas

DICAS PEDAGÓGICAS QUE VOCÊ CONHECE:
- Repertório de bolso: referência genérica e decorativa, sem conexão real com o tema → penalizado na C2
- Repertório produtivo: específico, contextualizado, articulado com o argumento
- Para melhorar a nota: praticar a C5 completa, variar conectivos, evitar "os mesmos" como pronome anafórico
- Leitura diversificada é o principal caminho para repertório genuíno

REGRAS DE COMPORTAMENTO:
- Responda SEMPRE em português brasileiro
- Seja concisa — respostas de até 4 parágrafos curtos
- Se não souber algo específico sobre o RedaCheck, diga que vai buscar a informação
- Nunca invente preços, funcionalidades ou critérios que não conhece
- Termine respostas complexas com uma dica prática ou encorajamento`;

let redaAberto = false;
let redaHistorico = [];
let redaPrimeiraVez = true;
let redaInicioConversa = null;

function salvarHistoricoChat(){
  try {
    const chave = 'rc_chat_' + (userCode || 'anonimo');
    localStorage.setItem(chave, JSON.stringify({
      historico: redaHistorico.slice(-40), // últimas 40 mensagens
      inicio: redaInicioConversa,
      primeiraVez: redaPrimeiraVez
    }));
  } catch(e){}
}

async function restaurarHistoricoChat(){
  if(!userCode) return;
  try {
    // 1. Tentar localStorage primeiro (mais rápido)
    const chave = 'rc_chat_' + userCode;
    const salvo = localStorage.getItem(chave);
    if(salvo){
      const d = JSON.parse(salvo);
      if(d.historico && d.historico.length > 0){
        _renderizarHistoricoChat(d.historico);
        return;
      }
    }
    // 2. Fallback: buscar do banco (outros dispositivos)
    const resp = await fetch(BACKEND_URL + '/historico-chat/' + userCode);
    if(!resp.ok) return;
    const data = await resp.json();
    if(data.mensagens && data.mensagens.length > 0){
      _renderizarHistoricoChat(data.mensagens);
      // Salvar no localStorage local para próximas visitas
      try {
        localStorage.setItem(chave, JSON.stringify({
          historico: data.mensagens, inicio: new Date().toISOString()
        }));
      } catch(e){}
    }
  } catch(e){ console.warn('Erro ao restaurar chat:', e); }
}

function _renderizarHistoricoChat(mensagens){
  redaHistorico = mensagens;
  redaInicioConversa = new Date().toISOString();
  redaPrimeiraVez = false;
  const msgs = document.getElementById('reda-msgs');
  if(msgs){
    msgs.innerHTML = '';
    redaHistorico.forEach(m => {
      if(m.role === 'user') redaAdicionarMsg('user', m.content);
      else redaAdicionarMsg('bot', m.content);
    });
  }
}

function redaSalvarConversa(){
  if(redaHistorico.length < 2) return;
  const duracao = redaInicioConversa
    ? Math.round((Date.now() - new Date(redaInicioConversa).getTime()) / 1000)
    : 0;
  // Salvar no banco
  fetch(BACKEND_URL + '/log/conversa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: userNomeCompleto || userName || 'Visitante',
      mensagens: redaHistorico,
      dataInicio: redaInicioConversa,
      duracao
    })
  }).catch(()=>{});
  // Salvar no localStorage (acesso rápido)
  salvarHistoricoChat();
}

function toggleReda(){
  redaAberto = !redaAberto;
  const panel = document.getElementById('reda-panel');
  const badge = document.getElementById('reda-badge');
  panel.classList.toggle('open', redaAberto);
  badge.classList.remove('show');

  // Salvar conversa ao fechar se houver mensagens
  if(!redaAberto && redaHistorico.length > 0){
    redaSalvarConversa();
  }

  if(redaAberto && redaPrimeiraVez){
    redaPrimeiraVez = false;
    redaInicioConversa = new Date().toISOString();
    // Restaurar conversa anterior (banco ou localStorage)
    restaurarHistoricoChat().then(() => {
      if(redaHistorico.length === 0){
        const saudacao = userName ? 'Olá, **' + userName + '**! ' : 'Olá! ';
        redaAdicionarMsg('bot', saudacao + 'Sou a **Reda**, assistente do RedaCheck. 👋\n\nPosso te ajudar com dúvidas sobre a plataforma, critérios de avaliação, como melhorar sua nota e muito mais. O que posso fazer agora?');
      }
    });
  }
}

function redaAdicionarMsg(tipo, texto){
  const msgs = document.getElementById('reda-msgs');
  const div = document.createElement('div');
  div.className = 'reda-msg ' + tipo;
  div.innerHTML = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  // Salvar histórico após cada mensagem do bot
  if(tipo === 'bot') salvarHistoricoChat();
}

function redaMostrarTyping(show){
  const t = document.getElementById('reda-typing');
  t.classList.toggle('show', show);
  if(show){
    const msgs = document.getElementById('reda-msgs');
    msgs.scrollTop = msgs.scrollHeight;
  }
}

function redaEnviarSugestao(btn){
  const texto = btn.textContent;
  document.getElementById('reda-sugestoes').style.display = 'none';
  redaProcessar(texto);
}

async function redaEnviar(){
  const input = document.getElementById('reda-input');
  const texto = input.value.trim();
  if(!texto) return;
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('reda-sugestoes').style.display = 'none';
  redaProcessar(texto);
}

async function redaProcessar(texto){
  redaAdicionarMsg('user', texto);
  redaHistorico.push({ role: 'user', content: texto });
  redaMostrarTyping(true);

  try {
    const response = await fetch(BACKEND_URL + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagens: redaHistorico,
        usuario: userNomeCompleto || userName || 'Visitante'
      })
    });

    const data = await response.json();
    redaMostrarTyping(false);

    if(data.resposta){
      redaHistorico.push({ role: 'assistant', content: data.resposta });
      redaAdicionarMsg('bot', data.resposta);
    } else {
      redaAdicionarMsg('bot', 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente!');
    }
  } catch(e) {
    redaMostrarTyping(false);
    redaAdicionarMsg('bot', 'Ops! Não consegui me conectar agora. Tente em instantes.');
  }
}

// Auto-resize do textarea
document.getElementById('reda-input').addEventListener('input', function(){
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

// Badge de notificação após 8 segundos (primeira visita)
setTimeout(()=>{
  if(!redaAberto){
    document.getElementById('reda-badge').classList.add('show');
  }
}, 8000);
</script>
</body>
</html>
