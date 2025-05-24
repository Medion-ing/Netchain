// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Registre d'attestation des noeuds NetChain
contract AttestationRegistry {

    /// Structure représentant un nœud attesté
    struct NodeInfo {
        string domain;         // Nom du domaine administratif
        string ip;             // Adresse IP ou ID du noeud
        bytes32 attestationHash; // Hash du rapport d'attestation signé
        uint256 timestamp;     // Date d’enregistrement
        bool registered;       // Statut d’enregistrement
    }

    /// Mapping entre l'adresse du nœud (wallet) et ses informations
    mapping(address => NodeInfo) public trustedNodes;

    /// Événement pour le journal
    event NodeRegistered(address indexed node, string domain, uint256 timestamp);

    /// Fonction d'enregistrement d'un nœud dans le registre
    function registerNode(string memory _domain, string memory _ip, bytes32 _attestationHash) public {
        require(!trustedNodes[msg.sender].registered, "Noeud deja enregistre");

        trustedNodes[msg.sender] = NodeInfo({
            domain: _domain,
            ip: _ip,
            attestationHash: _attestationHash,
            timestamp: block.timestamp,
            registered: true
        });

        emit NodeRegistered(msg.sender, _domain, block.timestamp);
    }

    /// Fonction publique pour vérifier si une adresse est un nœud attesté
    function isTrustedNode(address _node) public view returns (bool) {
        return trustedNodes[_node].registered;
    }

    /// Fonction publique pour obtenir le hash d’attestation d’un nœud
    function getAttestationHash(address _node) public view returns (bytes32) {
        require(trustedNodes[_node].registered, "Noeud non enregistre");
        return trustedNodes[_node].attestationHash;
    }
}
