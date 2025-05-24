// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SliceRequestManager {

    enum RequestStatus { Pending, Accepted, Rejected }

    struct SliceRequest {
        address client;           // Adresse du client ayant fait la demande
        string domain;            // Domaine visé (A, B, C...)
        string qos;               // Qualité de service (bande passante, latence)
        uint256 timestamp;        // Date de soumission
        RequestStatus status;     // État actuel de la requête
    }

    uint256 public requestCounter = 0;

    mapping(uint256 => SliceRequest) public requests;

    event SliceRequested(uint256 requestId, address client, string domain, string qos);
    event StatusUpdated(uint256 requestId, RequestStatus newStatus);

    /// Soumission d'une nouvelle requête de tranche par un client
    function submitRequest(string memory domain, string memory qos) public {
        requests[requestCounter] = SliceRequest(
            msg.sender,
            domain,
            qos,
            block.timestamp,
            RequestStatus.Pending
        );

        emit SliceRequested(requestCounter, msg.sender, domain, qos);
        requestCounter++;
    }

    /// Mise à jour du statut d'une demande (par un opérateur ou leader)
    function updateRequestStatus(uint256 requestId, RequestStatus newStatus) public {
        require(requestId < requestCounter, "Requete inexistante");
        requests[requestId].status = newStatus;

        emit StatusUpdated(requestId, newStatus);
    }

    /// Obtenir les détails d'une demande spécifique
    function getRequest(uint256 requestId) public view returns (
        address client,
        string memory domain,
        string memory qos,
        uint256 timestamp,
        RequestStatus status
    ) {
        require(requestId < requestCounter, "Requete inexistante");
        SliceRequest memory r = requests[requestId];
        return (r.client, r.domain, r.qos, r.timestamp, r.status);
    }
}
