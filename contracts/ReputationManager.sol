// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ReputationManager - Gestion de la réputation des nœuds et consommateurs dans CoNet
contract ReputationManager {

    // Structure représentant une évaluation
    struct Evaluation {
        address evaluator;        // Adresse de l’évaluateur
        uint8 score;              // Score donné (entre 1 et 5)
        string comment;           // Commentaire facultatif
        uint256 timestamp;        // Date de l’évaluation
    }

    // Mapping des évaluations reçues par un nœud (ou consommateur)
    mapping(address => Evaluation[]) public receivedEvaluations;

    // Score cumulé de chaque adresse
    mapping(address => uint256) public totalScores;
    mapping(address => uint256) public numberOfEvaluations;

    /// @notice Évaluer un nœud du réseau
    function evaluateNode(address nodeAddress, uint8 score, string memory comment) public {
        _evaluate(nodeAddress, score, comment);
    }

    /// @notice Évaluer un consommateur du réseau
    function evaluateConsumer(address consumerAddress, uint8 score, string memory comment) public {
        _evaluate(consumerAddress, score, comment);
    }

    /// @dev Fonction interne d’évaluation commune
    function _evaluate(address target, uint8 score, string memory comment) internal {
        require(target != msg.sender, "Auto-evaluation interdite");
        require(score >= 1 && score <= 5, "Score invalide");

        receivedEvaluations[target].push(Evaluation({
            evaluator: msg.sender,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        }));

        // Mise à jour des scores cumulatifs
        totalScores[target] += score;
        numberOfEvaluations[target]++;
    }

    /// @notice Obtenir la moyenne des scores pour un acteur (nœud ou consommateur)
    function getReputationScore(address target) public view returns (uint256 moyenne) {
        uint256 total = totalScores[target];
        uint256 count = numberOfEvaluations[target];
        if (count == 0) return 0;
        return total / count;
    }

    /// @notice Obtenir toutes les évaluations reçues par un acteur
    function getEvaluations(address target) public view returns (Evaluation[] memory) {
        return receivedEvaluations[target];
    }
}
