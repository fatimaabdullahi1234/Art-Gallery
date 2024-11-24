# Decentralized Autonomous Art Gallery

This project implements a decentralized autonomous art gallery using Clarity smart contracts on the Stacks blockchain. The system allows artists to exhibit their work as NFTs, curators to organize exhibitions, and visitors to purchase art.

## Features

1. Artwork Management
    - Artists can create an
      artwork NFT
    - Artists can update the price of their artwork
    - Visitors can purchase artworks

2. Exhibition Management
    - Curators can create exhibitions
    - Artists can approve exhibition rights for their artworks

3. Platform Management
    - Contract owner can set the platform fee for sales

## Smart Contract Functions

### Artwork Management
- `create-artwork`: Creates a new artwork NFT
- `update-artwork-price`: Updates the price of an existing artwork
- `buy-artwork`: Allows a visitor to purchase an artwork

### Exhibition Management
- `create-exhibition`: Creates a new exhibition
- `approve-exhibition-rights`: Approves an artwork to be part of an exhibition

### Platform Management
- `set-platform-fee`: Sets the platform fee for artwork sales

### Information Retrieval
- `get-artwork`: Retrieves information about a specific artwork
- `get-exhibition`: Retrieves information about a specific exhibition
- `get-exhibition-rights`: Checks if an artwork is approved for an exhibition
- `get-platform-fee`: Retrieves the current platform fee

## Testing

The project includes a comprehensive test suite using Vitest. The tests cover various scenarios including:

- Creating and updating artworks
- Buying artworks
- Creating exhibitions
- Approving exhibition rights
- Setting platform fees

To run the tests, use the following command:

```bash
npm test

