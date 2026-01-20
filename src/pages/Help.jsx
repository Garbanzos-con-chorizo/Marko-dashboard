import React from 'react';

export default function Help() {
    return (
        <div className="space-y-6">
            <header className="border-b border-border pb-4">
                <h1 className="text-2xl font-bold text-text">HELP & DOCS</h1>
                <p className="text-sm text-textMuted font-mono">AUTH, STRATEGY PACKAGES, AND PRIVATE GIT</p>
            </header>

            <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
                <h2 className="text-lg font-bold">STRATEGY PACKAGE CONTRACT</h2>
                <p className="text-sm text-textSecondary">
                    Strategies must follow the Marko package contract to be installed and executed correctly.
                </p>
                <div className="text-xs font-mono bg-background border border-border rounded p-3 space-y-1">
                    <div>strategy.py (required)</div>
                    <div>metadata.json (optional but recommended)</div>
                    <div>README.md (optional, shown in the UI)</div>
                </div>
                <p className="text-sm text-textSecondary">Minimum requirements:</p>
                <div className="text-xs font-mono bg-background border border-border rounded p-3 space-y-1">
                    <div>class YourStrategyName:</div>
                    <div>    def __init__(self, params):</div>
                    <div>        ...</div>
                    <div>    def step(self, bar):</div>
                    <div>        ...</div>
                </div>
                <p className="text-sm text-textSecondary">
                    If metadata.json is present, include an entrypoint name and default parameters:
                </p>
                <div className="text-xs font-mono bg-background border border-border rounded p-3 space-y-1">
                    <div>{'{'}</div>
                    <div>  "entrypoint": "YourStrategyName",</div>
                    <div>  "description": "Short description",</div>
                    <div>  "default_params": {"{ \"example_param\": 10 }"}</div>
                    <div>{'}'}</div>
                </div>
                <p className="text-sm text-textSecondary">Basic workflow for a new strategy:</p>
                <div className="text-xs font-mono bg-background border border-border rounded p-3 space-y-1">
                    <div>1) Create a repo with strategy.py + optional metadata.json/README.md</div>
                    <div>2) Ensure the strategy class name matches metadata.json entrypoint</div>
                    <div>3) Push to Git (public or private)</div>
                </div>
            </section>

            <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
                <h2 className="text-lg font-bold">PRIVATE GIT REPOS</h2>
                <p className="text-sm text-textSecondary">
                    To install from a private HTTPS repo, generate a personal access token and paste it into the
                    install form. The token is used only for cloning and is not stored in the repo URL.
                </p>
                <p className="text-sm text-textSecondary">Install steps:</p>
                <div className="text-xs font-mono bg-background border border-border rounded p-3 space-y-1">
                    <div>1) Open Marketplace or Library</div>
                    <div>2) Click "Install from Git"</div>
                    <div>3) Paste repo URL + version/tag</div>
                    <div>4) Set visibility: PUBLIC or PRIVATE</div>
                    <div>5) Add token if repo is private</div>
                </div>
                <p className="text-sm text-textSecondary">Visibility rules:</p>
                <div className="text-xs font-mono bg-background border border-border rounded p-3 space-y-1">
                    <div>PUBLIC - appears in Marketplace for all users</div>
                    <div>PRIVATE - appears only in your Library</div>
                </div>
            </section>
        </div>
    );
}
