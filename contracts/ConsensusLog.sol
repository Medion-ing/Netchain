// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ConsensusLog - Gestion d’un processus de consensus simplifié pour valider des propositions
contract ConsensusLog {

    struct Proposal {
        uint256 id;            // Identifiant unique
        address proposer;      // Adresse du proposeur (leader)
        string data;           // Contenu ou but de la proposition
        uint256 timestamp;     // Date de soumission
        uint256 approvals;     // Nombre de votes favorables
        uint256 rejections;    // Nombre de votes défavorables
        bool finalized;        // Statut de validation
    }

    Proposal[] public proposals;  // Tableau des propositions
    mapping(uint256 => mapping(address => bool)) public votes; // Suivi des votes pour éviter les doublons

    /// @notice Soumet une nouvelle proposition au vote
    /// @param _data Description de la proposition
    function submitProposal(string memory _data) public {
        proposals.push(Proposal({
            id: proposals.length,
            proposer: msg.sender,
            data: _data,
            timestamp: block.timestamp,
            approvals: 0,
            rejections: 0,
            finalized: false
        }));
    }

    /// @notice Vote sur une proposition donnée
    /// @param proposalId ID de la proposition
    /// @param approve true = vote favorable, false = défavorable
    function vote(uint256 proposalId, bool approve) public {
        require(proposalId < proposals.length, "Proposition inexistante");
        require(!votes[proposalId][msg.sender], "Vote deja effectue");

        Proposal storage p = proposals[proposalId];
        votes[proposalId][msg.sender] = true;

        if (approve) {
            p.approvals += 1;
        } else {
            p.rejections += 1;
        }

        // On finalise dès qu’on atteint 3 votes (à adapter selon ton seuil réel)
        if (p.approvals + p.rejections >= 3) {
            p.finalized = true;
        }
    }

    /// @notice Récupère l'état d’une proposition de manière lisible
    function getProposal(uint256 proposalId) public view returns (
        string memory contenu,
        string memory statut,
        uint256 votesTotaux,
        uint256 votesPositifs
    ) {
        Proposal memory p = proposals[proposalId];
        contenu = p.data;
        statut = p.approvals > p.rejections ? "acceptee" : "refusee";
        votesTotaux = p.approvals + p.rejections;
        votesPositifs = p.approvals;
    }

    /// Fonction ajoutée : donne la longueur du tableau des propositions
    function proposalsLength() public view returns (uint256) {
        return proposals.length;
    }
}
