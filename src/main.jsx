import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { checkDatabaseTables } from './utils/dbHelpers'
import { createTables, createTablesManually, createTablesDirect } from './utils/createTables.js'
import { runDiagnostics, checkSocialLinksTable } from './utils/diagnostics'

if (import.meta.env.DEV) {
  
  runDiagnostics()
    .then(results => {
      
      return checkSocialLinksTable();
    })
    .then(socialLinksResults => {
    })
    .catch(error => {
    });
}

runDiagnostics().then(diagnosticResults => {
  
  // try to initialize db tables
  return Promise.all([
    checkDatabaseTables(),
    createTables()
  ]);
}).then(([tablesExist, tablesCreated]) => {
  
  if (!tablesExist.profiles_new && !tablesCreated) {
    console.warn('Tables missing and RPC methods unavailable. Trying manual SQL approach...');
    return createTablesManually().then(result => {
      if (!result) {
        console.warn('Manual SQL via RPC failed. Trying direct SQL execution...');
        return createTablesDirect();
      }
      return result;
    });
  }
  
  return true;
}).then(() => {
  return runDiagnostics().then(finalDiagnostics => {
    return finalDiagnostics;
  });
}).then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}).catch(error => {
  
  // Still render the app even if initialization fails
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}) 