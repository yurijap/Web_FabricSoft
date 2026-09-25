import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import App from './App';
import './index.css';
import { FabricProvider } from './store/FabricContext';
import { ThemeProvider } from './theme/ThemeProvider';

export function render(url: string = '/') {
  return renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <ThemeProvider>
          <FabricProvider>
            <App />
          </FabricProvider>
        </ThemeProvider>
      </StaticRouter>
    </React.StrictMode>
  );
}
