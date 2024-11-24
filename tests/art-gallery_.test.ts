import { describe, it, expect, beforeEach } from 'vitest';

// Mock contract state
let nextArtworkId = 0;
let nextExhibitionId = 0;
let platformFee = 50; // 5%
let artworks = {};
let exhibitions = {};
let exhibitionRights = {};

// Mock contract owner
const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

// Helper function to reset state before each test
function resetState() {
  nextArtworkId = 0;
  nextExhibitionId = 0;
  platformFee = 50;
  artworks = {};
  exhibitions = {};
  exhibitionRights = {};
}

// Mock contract functions
function createArtwork(sender, title, description, price) {
  const artworkId = nextArtworkId++;
  artworks[artworkId] = {
    artist: sender,
    title,
    description,
    price,
    owner: sender,
    forSale: true
  };
  return { type: 'ok', value: artworkId };
}

function updateArtworkPrice(sender, artworkId, newPrice) {
  if (!artworks[artworkId]) {
    return { type: 'err', value: 101 }; // err-not-found
  }
  if (artworks[artworkId].owner !== sender) {
    return { type: 'err', value: 102 }; // err-unauthorized
  }
  if (newPrice <= 0) {
    return { type: 'err', value: 106 }; // err-invalid-price
  }
  artworks[artworkId].price = newPrice;
  artworks[artworkId].forSale = true;
  return { type: 'ok', value: true };
}

function buyArtwork(sender, artworkId) {
  if (!artworks[artworkId]) {
    return { type: 'err', value: 101 }; // err-not-found
  }
  const artwork = artworks[artworkId];
  if (sender === artwork.owner) {
    return { type: 'err', value: 102 }; // err-unauthorized
  }
  if (!artwork.forSale) {
    return { type: 'err', value: 104 }; // err-not-for-sale
  }
  // In a real scenario, we would check for sufficient funds here
  const oldOwner = artwork.owner;
  artwork.owner = sender;
  artwork.forSale = false;
  return { type: 'ok', value: true };
}

function createExhibition(sender, title, description, artworkIds, duration) {
  const exhibitionId = nextExhibitionId++;
  exhibitions[exhibitionId] = {
    curator: sender,
    title,
    description,
    artworkIds,
    startBlock: 0, // Mock block height
    endBlock: duration
  };
  return { type: 'ok', value: exhibitionId };
}

function approveExhibitionRights(sender, artworkId, exhibitionId) {
  if (!artworks[artworkId]) {
    return { type: 'err', value: 101 }; // err-not-found
  }
  if (artworks[artworkId].owner !== sender) {
    return { type: 'err', value: 102 }; // err-unauthorized
  }
  exhibitionRights[`${artworkId}-${exhibitionId}`] = { approved: true };
  return { type: 'ok', value: true };
}

function setPlatformFee(sender, newFee) {
  if (sender !== contractOwner) {
    return { type: 'err', value: 100 }; // err-owner-only
  }
  if (newFee > 1000) {
    return { type: 'err', value: 106 }; // err-invalid-price
  }
  platformFee = newFee;
  return { type: 'ok', value: true };
}

// Tests
describe('Decentralized Autonomous Art Gallery', () => {
  beforeEach(() => {
    resetState();
  });
  
  it('allows artists to create and update artworks', () => {
    const artist = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    
    const createResult = createArtwork(artist, 'Mona Lisa', 'A famous painting', 1000000000);
    expect(createResult).toEqual({ type: 'ok', value: 0 });
    
    const updateResult = updateArtworkPrice(artist, 0, 1500000000);
    expect(updateResult).toEqual({ type: 'ok', value: true });
    
    expect(artworks[0].price).toBe(1500000000);
  });
  
  it('allows visitors to buy artworks', () => {
    const artist = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const buyer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    createArtwork(artist, 'Starry Night', 'A night sky', 1000000000);
    
    const buyResult = buyArtwork(buyer, 0);
    expect(buyResult).toEqual({ type: 'ok', value: true });
    
    expect(artworks[0].owner).toBe(buyer);
    expect(artworks[0].forSale).toBe(false);
  });
  
  it('allows curators to create exhibitions', () => {
    const curator = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    const createResult = createExhibition(curator, 'Modern Art', 'An exhibition of modern art', [0, 1, 2], 1000);
    expect(createResult).toEqual({ type: 'ok', value: 0 });
    
    expect(exhibitions[0].curator).toBe(curator);
  });
  
  it('allows artwork owners to approve exhibition rights', () => {
    const artist = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const curator = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    createArtwork(artist, 'The Persistence of Memory', 'Melting clocks', 2000000000);
    createExhibition(curator, 'Surrealism', 'A surrealist exhibition', [0], 1000);
    
    const approveResult = approveExhibitionRights(artist, 0, 0);
    expect(approveResult).toEqual({ type: 'ok', value: true });
    
    expect(exhibitionRights['0-0'].approved).toBe(true);
  });
  
  it('allows the contract owner to set the platform fee', () => {
    const newFee = 30; // 3%
    
    const setFeeResult = setPlatformFee(contractOwner, newFee);
    expect(setFeeResult).toEqual({ type: 'ok', value: true });
    
    expect(platformFee).toBe(newFee);
  });
  
  it('prevents non-owners from setting the platform fee', () => {
    const nonOwner = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const newFee = 30; // 3%
    
    const setFeeResult = setPlatformFee(nonOwner, newFee);
    expect(setFeeResult).toEqual({ type: 'err', value: 100 }); // err-owner-only
    
    expect(platformFee).toBe(50); // Unchanged
  });
});

