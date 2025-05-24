// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title ResourceLedger - Suivi de l'état des ressources par nœud dans CoNet
contract ResourceLedger {

    /// @notice Structure représentant l'état des ressources d'un nœud
    struct ResourceState {
        uint256 totalCPU;      // Capacité totale CPU du nœud
        uint256 totalMemory;   // Capacité totale mémoire
        uint256 usedCPU;       // CPU actuellement utilisée
        uint256 usedMemory;    // Mémoire actuellement utilisée
        uint256 timestamp;     // Dernière mise à jour
    }

    /// @dev Mapping de l'état des ressources par nœud (adresse)
    mapping(address => ResourceState) public nodeResources;

    /// @notice Événement de mise à jour des ressources
    event ResourceUpdated(
        address indexed node,
        uint256 totalCPU,
        uint256 totalMemory,
        uint256 usedCPU,
        uint256 usedMemory,
        uint256 timestamp
    );

    /// @notice Met à jour l'état des ressources d'un nœud
    function updateResources(
        uint256 totalCPU,
        uint256 totalMemory,
        uint256 usedCPU,
        uint256 usedMemory
    ) public {
        require(usedCPU <= totalCPU, "CPU utilisee > CPU totale");
        require(usedMemory <= totalMemory, "Memoire utilisee > memoire totale");

        nodeResources[msg.sender] = ResourceState({
            totalCPU: totalCPU,
            totalMemory: totalMemory,
            usedCPU: usedCPU,
            usedMemory: usedMemory,
            timestamp: block.timestamp
        });

        emit ResourceUpdated(
            msg.sender,
            totalCPU,
            totalMemory,
            usedCPU,
            usedMemory,
            block.timestamp
        );
    }

    /// @notice Vérifie si le nœud a suffisamment de ressources libres pour une demande
    function checkAvailability(
        address node,
        uint256 cpuRequested,
        uint256 memoryRequested
    ) public view returns (bool available) {
        ResourceState memory state = nodeResources[node];

        bool cpuOK = (state.totalCPU - state.usedCPU) >= cpuRequested;
        bool memOK = (state.totalMemory - state.usedMemory) >= memoryRequested;

        return cpuOK && memOK;
    }
}
