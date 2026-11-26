interface StorageGuideModalProps {
  open: boolean;
  storageMode: 'google-sheets-api' | 'apps-script' | 'demo-preview';
  spreadsheetId: string;
  onClose: () => void;
}

export function StorageGuideModal({
  open,
  storageMode,
  spreadsheetId,
  onClose,
}: StorageGuideModalProps) {
  if (!open) return null;

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <div className="modal-backdrop no-print" role="dialog" aria-modal="true" aria-labelledby="db-modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="db-modal-title">📊 Google Sheets Database Status</h2>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-status-line">
            <strong>Current Mode:</strong>{' '}
            {storageMode === 'google-sheets-api'
              ? '✅ Connected live via Google Sheets API v4'
              : storageMode === 'apps-script'
                ? '✅ Connected live via Google Apps Script Bridge'
                : '🟡 Demo Preview Mode (ready for live Google Sheet credentials)'}
          </p>

          <p>
            Your 6-table Google Sheets database (<code>Topics</code>, <code>WarmupChallenges</code>,{' '}
            <code>WordVault</code>, <code>StudentProfiles</code>, <code>WarmupSubmissions</code>,{' '}
            <code>WritingDrafts</code>) is ready here:
          </p>

          <p>
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="sheet-link">
              Open Google Sheets Database ↗
            </a>
          </p>

          {storageMode === 'demo-preview' && (
            <div className="setup-steps-box">
              <h3>Connect Permanent Writes in 60 Seconds (Parent Setup)</h3>
              <ol>
                <li>
                  Open the Google Sheet above → click <strong>Extensions → Apps Script</strong>.
                </li>
                <li>
                  Paste <code>google-apps-script/Code.gs</code> from the GitHub repo, set Script
                  Property <code>APPS_SCRIPT_SECRET</code>, and deploy as a Web App.
                </li>
                <li>
                  In Vercel Project Settings → Environment Variables, add{' '}
                  <code>GOOGLE_APPS_SCRIPT_URL</code> and <code>APPS_SCRIPT_SECRET</code> (or a
                  Google Service Account via <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> +{' '}
                  <code>GOOGLE_PRIVATE_KEY</code>), then redeploy!
                </li>
              </ol>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary btn-navy" onClick={onClose}>
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
