import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import JVXProvider from "./JVX/jvxProvider";
import * as serviceWorker from './serviceWorker';
import 'primereact/resources/themes/nova/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import "primeflex/primeflex.css";
import SplitPanel from "./JVX/components/panels/split/SplitPanel";


ReactDOM.render(
  <React.StrictMode>
      <JVXProvider>
          <SplitPanel />
      </JVXProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
