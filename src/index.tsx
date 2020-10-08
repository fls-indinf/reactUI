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
import useRowSelect from "./JVX/components/zhooks/useRowSelect";
import useDataProviderData from "./JVX/components/zhooks/useDataProviderData";


ReactDOM.render(
  <React.StrictMode>
      <JVXProvider>
          <App />
      </JVXProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

module.exports.useRowSelect = useRowSelect
module.exports.useDataProviderData = useDataProviderData

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
