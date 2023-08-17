import { convertHexToString } from 'xrpl';

import { NFTData } from '@gemwallet/constants';
import { IPFSResolverPrefix } from '@gemwallet/constants/src/xrpl/nft.constant';

import { parseJSON } from './NFTViewer';

import { isImageUrl } from '.';

export const resolveNFTData = async (data: {
  NFTokenID?: string;
  URI?: string;
}): Promise<NFTData> => {
  data.NFTokenID = data.NFTokenID || '';
  let URL = data.URI ? convertHexToString(data.URI) : '';

  if (!URL.length) {
    return {
      NFTokenID: data.NFTokenID,
      description: 'No data'
    };
  }

  URL = URL.replace('ipfs://', IPFSResolverPrefix);

  // Case 1 - Image URL
  if (isImageUrl(URL)) {
    try {
      // Case 1.1 - The URL is directly an image
      await fetch(URL);
      return {
        NFTokenID: data.NFTokenID,
        image: URL
      };
    } catch (e) {
      // Case 1.2 - The URL is an IPFS hash
      if (!URL.startsWith(IPFSResolverPrefix) && !URL.startsWith('http')) {
        URL = `${IPFSResolverPrefix}${URL}`;
      }
      try {
        await fetch(URL);
        return {
          NFTokenID: data.NFTokenID,
          image: URL
        };
      } catch (e) {}
    }
  } else {
    // Case 2 - JSON URL
    try {
      await fetch(URL);
      // Case 2.1 - The URL is directly a JSON
      // If it follows the XLS-24 standard, it will be automatically parsed
      return parseJSON(URL, data.NFTokenID);
    } catch (e) {}
    // Case 2.2 - The URL is an IPFS hash
    if (!URL.startsWith(IPFSResolverPrefix) && !URL.startsWith('http')) {
      try {
        await fetch(`${IPFSResolverPrefix}${URL}`);
        // If it follows the XLS-24 standard, it will be automatically parsed
        return parseJSON(`${IPFSResolverPrefix}${URL}`, data.NFTokenID);
      } catch (e) {}
    }
  }
  // Case 3 - Return the raw NFT attributes
  return {
    NFTokenID: data.NFTokenID,
    description: URL.replace(IPFSResolverPrefix, 'ipfs://')
  };
};
