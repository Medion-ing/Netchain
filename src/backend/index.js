require("dotenv").config();
const { ethers } = require("ethers");
const winston = require("winston");

// Configuration du logger
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ 
      filename: 'netchain.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Configuration
const RPC_URL = process.env.RPC_URL;
const provider = new ethers.JsonRpcProvider(RPC_URL);

const nodes = {
  node1: new ethers.Wallet(process.env.PRIVATE_KEY_NODE1, provider),
  node2: new ethers.Wallet(process.env.PRIVATE_KEY_NODE2, provider),
  node3: new ethers.Wallet(process.env.PRIVATE_KEY_NODE3, provider),
  node4: new ethers.Wallet(process.env.PRIVATE_KEY_NODE4, provider),
  node5: new ethers.Wallet(process.env.PRIVATE_KEY_NODE5, provider),
};

const contractAddresses = {
  sliceRequestManager: "0x77a034e22aa2a65b5f8ab7e8438ef5f756f8b419",
  attestationRegistry: "0x53e547ce7579b8483e6302ce25369469309c8889",
  resourceLedger: "0xcb8a5538631201736ef48aec47f5ac1dad02939a",
  reputationManager: "0xd4db9b88778fdd9664cdde155340585118cbeeac",
  consensusLog: "0xae0cdce0608e385c45c90c6faad7f1de785cbea9",
};

const ABIs = require("./abi.json");

const CONFIG = {
  domains: ["IA", "Blockchain", "Cloud", "IoT", "VR"],
  qosLevels: ["Bronze", "Silver", "Gold", "Platinum"],
  requiredApprovals: 2,
  minReputation: 4
};

// Utilitaires
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function generateRandomIP() {
  return `192.168.1.${Math.floor(Math.random() * 255)}`;
}

function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toISOString();
}

function displaySection(title) {
  console.log(`\n=== ${title.toUpperCase()} ===`);
}

(async () => {
  displaySection("Début de la simulation");
  const simulationStart = Date.now();

  try {
    // Initialisation des contrats
    const contracts = {
      sliceRequestManager: new ethers.Contract(contractAddresses.sliceRequestManager, ABIs.SliceRequestManager, provider),
      attestationRegistry: new ethers.Contract(contractAddresses.attestationRegistry, ABIs.AttestationRegistry, provider),
      resourceLedger: new ethers.Contract(contractAddresses.resourceLedger, ABIs.ResourceLedger, provider),
      reputationManager: new ethers.Contract(contractAddresses.reputationManager, ABIs.ReputationManager, provider),
      consensusLog: new ethers.Contract(contractAddresses.consensusLog, ABIs.ConsensusLog, provider),
    };

    // Sélection aléatoire des participants
    const shuffledNodes = shuffleArray(Object.entries(nodes));
    const [clientName, clientWallet] = shuffledNodes[0];
    const [candidateName, candidateWallet] = shuffledNodes[1];
    const voters = shuffledNodes.slice(2, 5);

    displaySection("1. Demande de slice");
    const randomDomain = getRandomElement(CONFIG.domains);
    const randomQoS = getRandomElement(CONFIG.qosLevels);
    
    const reqTx = await contracts.sliceRequestManager
      .connect(clientWallet)
      .submitRequest(randomDomain, randomQoS, { gasLimit: 300000 });
    const reqReceipt = await reqTx.wait();
    const reqTimestamp = (await provider.getBlock(reqReceipt.blockNumber)).timestamp;
    const requestId = (await contracts.sliceRequestManager.requestCounter()) - 1n;
    
    console.log(`[${formatTimestamp(reqTimestamp)}] Client: ${clientName}`);
    console.log(`• Type: ${randomDomain} (${randomQoS})`);
    console.log(`• ID Requête: ${requestId}`);
    console.log(`• TX Hash: ${reqReceipt.hash}`);

    logger.info({
      event: "SLICE_REQUEST",
      client: clientName,
      domain: randomDomain,
      qos: randomQoS,
      requestId: requestId.toString(),
      txHash: reqReceipt.hash,
      timestamp: new Date().toISOString()
    });

    displaySection("2. Enregistrement candidat");
    try {
      const isRegistered = await contracts.attestationRegistry.isTrustedNode(candidateWallet.address);
      if (!isRegistered) {
        const ipAddress = generateRandomIP();
        const attestationHash = ethers.keccak256(ethers.toUtf8Bytes(`attest-${Date.now()}`));
        
        const regTx = await contracts.attestationRegistry
          .connect(candidateWallet)
          .registerNode(randomDomain, ipAddress, attestationHash, { gasLimit: 300000 });
        const regReceipt = await regTx.wait();
        const regTimestamp = (await provider.getBlock(regReceipt.blockNumber)).timestamp;
        
        console.log(`[${formatTimestamp(regTimestamp)}] Candidat: ${candidateName}`);
        console.log(`• Statut: Nouvel enregistrement`);
        console.log(`• IP: ${ipAddress}`);
        console.log(`• TX Hash: ${regReceipt.hash}`);

        logger.info({
          event: "CANDIDATE_REGISTERED",
          candidate: candidateName,
          domain: randomDomain,
          ipAddress: ipAddress,
          txHash: regReceipt.hash,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`[${formatTimestamp(Math.floor(Date.now()/1000))}] Candidat: ${candidateName}`);
        console.log(`• Statut: Déjà enregistré`);

        logger.info({
          event: "CANDIDATE_EXISTING",
          candidate: candidateName,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log(`[ERREUR] Enregistrement: ${error.reason || error.message}`);
      logger.error({
        event: "REGISTRATION_ERROR",
        error: error.message,
        candidate: candidateName,
        timestamp: new Date().toISOString()
      });
    }

    displaySection("3. Déclaration des ressources");
    const totalCPU = 4 + Math.floor(Math.random() * 8);
    const totalMemory = 4096 + Math.floor(Math.random() * 12288);
    
    const resTx = await contracts.resourceLedger
      .connect(candidateWallet)
      .updateResources(totalCPU, totalMemory, 0, 0, { gasLimit: 300000 });
    const resReceipt = await resTx.wait();
    const resTimestamp = (await provider.getBlock(resReceipt.blockNumber)).timestamp;
    
    console.log(`[${formatTimestamp(resTimestamp)}] Candidat: ${candidateName}`);
    console.log(`• CPU: ${totalCPU} cores`);
    console.log(`• Mémoire: ${totalMemory} MB`);
    console.log(`• TX Hash: ${resReceipt.hash}`);

    logger.info({
      event: "RESOURCES_DECLARED",
      candidate: candidateName,
      cpu: totalCPU,
      memory: totalMemory,
      txHash: resReceipt.hash,
      timestamp: new Date().toISOString()
    });

    displaySection("4. Évaluations des votants");
    for (const [voterName, voterWallet] of voters) {
      const score = 3 + Math.round(Math.random() * 2);
      const tx = await contracts.reputationManager
        .connect(voterWallet)
        .evaluateNode(candidateWallet.address, score, `eval-${Date.now()}`, { gasLimit: 300000 });
      const txReceipt = await tx.wait();
      const txTimestamp = (await provider.getBlock(txReceipt.blockNumber)).timestamp;
      
      console.log(`[${formatTimestamp(txTimestamp)}] Votant: ${voterName}`);
      console.log(`• Note: ${score}/5`);
      console.log(`• TX Hash: ${txReceipt.hash}`);

      logger.info({
        event: "REPUTATION_EVALUATION",
        voter: voterName,
        candidate: candidateName,
        score: score,
        txHash: txReceipt.hash,
        timestamp: new Date().toISOString()
      });
    }

    const reputation = await contracts.reputationManager.getReputationScore(candidateWallet.address);
    console.log(`\n[REPUTATION FINALE] Candidat ${candidateName}: ${reputation}/5`);

    logger.info({
      event: "REPUTATION_FINAL",
      candidate: candidateName,
      reputation: reputation.toString(),
      timestamp: new Date().toISOString()
    });

    displaySection("5. Soumission de proposition");
    const proposalData = `req=${requestId},node=${candidateWallet.address}`;
    
    const proposalTx = await contracts.consensusLog
      .connect(candidateWallet)
      .submitProposal(proposalData, { gasLimit: 300000 });
    const proposalReceipt = await proposalTx.wait();
    const proposalTimestamp = (await provider.getBlock(proposalReceipt.blockNumber)).timestamp;
    
    let proposalId = 0;
    try {
      for (let i = 0; i < 100; i++) {
        try {
          const prop = await contracts.consensusLog.proposals(i);
          if (prop.data === proposalData) {
            proposalId = i;
            break;
          }
        } catch {
          break;
        }
      }
    } catch (error) {
      console.log(`[WARN] Impossible de trouver l'ID de proposition: ${error.message}`);
      logger.warn({
        event: "PROPOSAL_ID_NOT_FOUND",
        error: error.message,
        requestId: requestId.toString(),
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[${formatTimestamp(proposalTimestamp)}] Candidat: ${candidateName}`);
    console.log(`• ID Proposition: ${proposalId}`);
    console.log(`• Contenu: ${proposalData}`);
    console.log(`• TX Hash: ${proposalReceipt.hash}`);

    logger.info({
      event: "PROPOSAL_SUBMITTED",
      candidate: candidateName,
      proposalId: proposalId,
      requestId: requestId.toString(),
      proposalData: proposalData,
      txHash: proposalReceipt.hash,
      timestamp: new Date().toISOString()
    });

    displaySection("6. Processus de vote");
    let positiveVotes = 0;
    for (const [voterName, voterWallet] of voters) {
      const vote = Math.random() > 0.3;
      const voteTx = await contracts.consensusLog
        .connect(voterWallet)
        .vote(proposalId, vote, { gasLimit: 300000 });
      const voteReceipt = await voteTx.wait();
      const voteTimestamp = (await provider.getBlock(voteReceipt.blockNumber)).timestamp;
      
      console.log(`[${formatTimestamp(voteTimestamp)}] Votant: ${voterName}`);
      console.log(`• Vote: ${vote ? "POUR" : "CONTRE"}`);
      console.log(`• TX Hash: ${voteReceipt.hash}`);

      logger.info({
        event: "VOTE_CAST",
        voter: voterName,
        proposalId: proposalId,
        vote: vote ? "FOR" : "AGAINST",
        txHash: voteReceipt.hash,
        timestamp: new Date().toISOString()
      });

      if (vote) positiveVotes++;
    }

    displaySection("7. Résultat final");
    const proposal = await contracts.consensusLog.getProposal(proposalId);
    const request = await contracts.sliceRequestManager.getRequest(requestId);
    
    const meetsVoteRequirement = positiveVotes >= CONFIG.requiredApprovals;
    const meetsReputationRequirement = reputation >= CONFIG.minReputation;
    const isApproved = meetsVoteRequirement && meetsReputationRequirement;
    const consensusStatus = isApproved ? "ACCEPTEE" : "REJETEE";

    console.log("\n[ANALYSE]");
    console.log(`• Votes requis: ${CONFIG.requiredApprovals}/${voters.length}`);
    console.log(`  -> Obtenus: ${positiveVotes} (${meetsVoteRequirement ? "✅ SUFFISANT" : "❌ INSUFFISANT"})`);
    console.log(`• Réputation minimale: ${CONFIG.minReputation}`);
    console.log(`  -> Actuelle: ${reputation} (${meetsReputationRequirement ? "✅ SUFFISANTE" : "❌ INSUFFISANTE"})`);
    console.log(`• Consensus: ${consensusStatus}`);

    if (isApproved) {
      const upTx = await contracts.sliceRequestManager
        .connect(candidateWallet)
        .updateRequestStatus(requestId, 1, { gasLimit: 300000 });
      await upTx.wait();
    }

    console.log("\n[DÉCISION FINALE]");
    console.log(`• Statut: ${isApproved ? "🟢 APPROUVÉE" : "🔴 REJETÉE"}`);
    console.log(`• Requête ${requestId}: ${isApproved ? "🟢 ACCEPTÉE" : "🔴 REJETÉE"}`);
    console.log(`• Détails: ${randomDomain} (${randomQoS})`);
    console.log(`\n⏱️ Durée totale: ${((Date.now() - simulationStart)/1000).toFixed(2)} secondes`);

    logger.info({
      event: "FINAL_DECISION",
      requestId: requestId.toString(),
      status: isApproved ? "APPROVED" : "REJECTED",
      reason: !meetsVoteRequirement ? "INSUFFICIENT_VOTES" 
             : !meetsReputationRequirement ? "INSUFFICIENT_REPUTATION" 
             : "SUCCESS",
      votes: `${positiveVotes}/${voters.length}`,
      reputation: reputation.toString(),
      duration: `${((Date.now() - simulationStart)/1000).toFixed(2)}s`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("\n[ERREUR CRITIQUE]", error.reason || error.message);
    console.error("Stack trace:", error.stack);
    logger.error({
      event: "SIMULATION_ERROR",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
})();
