import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/transactions')
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(err => console.error("Erreur de chargement:", err));
  }, []);

  // Fonction pour formater les données
  const formatEvent = (event) => {
    switch(event.message.event) {
      case 'SLICE_REQUEST':
        return `📦 Demande de ${event.message.domain} (${event.message.qos}) par ${event.message.client}`;
      case 'RESOURCES_DECLARED':
        return `💻 ${event.message.candidate}: ${event.message.cpu} CPU / ${event.message.memory} MB RAM`;
      case 'FINAL_DECISION':
        return `✅ ${event.message.status === 'APPROVED' ? 'APPROUVÉ' : 'REJETÉ'} (${event.message.reputation}/5 rep, ${event.message.votes} votes)`;
      default:
        return JSON.stringify(event.message, null, 2);
    }
  };

  return (
    <div className="App">
      <h1>NetChain Explorer</h1>
      <div className="transaction-list">
        {transactions.map((tx, i) => (
          <div key={i} className={`transaction-card ${tx.message.event === 'FINAL_DECISION' ? 
            (tx.message.status === 'APPROVED' ? 'approved' : 'rejected') : ''}`}>
            <div className="transaction-header">
              <span className="event-type">{tx.message.event}</span>
              <span className="timestamp">
                {new Date(tx.message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="transaction-body">
              {formatEvent(tx)}
            </div>
            {tx.message.txHash && (
              <div className="tx-hash">
                TX: {tx.message.txHash.substring(0, 12)}...{tx.message.txHash.substring(tx.message.txHash.length - 4)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
