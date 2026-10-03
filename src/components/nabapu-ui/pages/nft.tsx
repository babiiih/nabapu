/**
 * NFT Collection (port dari template `nft()`) — Nabapu 1000,
 * mint info real dari NftPage (supply on-chain), grid collectibles.
 */
import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { parseAbi } from 'viem';
import { NFT_COLLECTION } from '@/contracts';
import { NB_ASSET } from '../data';

const NFT_ABI = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
]);

const RARITIES = ['Common', 'Common', 'Uncommon', 'Common', 'Rare', 'Common', 'Uncommon', 'Epic', 'Common', 'Rare', 'Common', 'Uncommon', 'Common', 'Rare', 'Epic', 'Common', 'Uncommon', 'Common'];
const RARITY_IMG: Record<string, number> = { Epic: 11, Rare: 10, Uncommon: 9, Common: 8 };

export function NbNft() {
  const [shown, setShown] = useState(12);
  const { address } = useAccount();
  const { data: totalSupply } = useReadContract({
    abi: NFT_ABI,
    address: NFT_COLLECTION,
    functionName: 'totalSupply',
  });
  const { data: balance } = useReadContract({
    abi: NFT_ABI,
    address: NFT_COLLECTION,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const supply = totalSupply ? Number(totalSupply) : 0;
  const mine = balance ? Number(balance) : 0;
  const pct = supply ? (supply / 1000) * 100 : 0;

  const nftCard = (i: number) => {
    const rarity = RARITIES[i % RARITIES.length];
    const img = RARITY_IMG[rarity];
    return (
      <div className="nft-card" data-rarity={rarity} key={i}>
        <img src={NB_ASSET(img)} alt="" />
        <div className="nft-info">
          <b>#{String(i + 1).padStart(4, '0')}</b>
          <span className={`rarity ${rarity.toLowerCase()}`}>{rarity}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <section className="nft-hero">
        <div className="nft-copy">
          <div className="eyebrow">FREE MINT · GAS ONLY</div>
          <h1>Nabapu 1000</h1>
          <p>
            1,000 collectibles on Robinhood Chain Testnet — Common to Legendary. Rarity is
            drawn randomly from the on-chain pool.
          </p>
          <div className="mint-count">
            {String(supply).padStart(3, '0')} <small>/ 1000 MINTED</small>
          </div>
          <div className="mint-bar">
            <i style={{ width: `${Math.max(pct, 0.5)}%` }} />
          </div>
          <button className="primary-btn" data-connect>
            {address ? `You own ${mine}` : 'Connect wallet to mint'}
          </button>
        </div>
        <div className="nft-showcase">
          <img src={NB_ASSET(10)} alt="" />
          <img src={NB_ASSET(11)} alt="" />
        </div>
      </section>

      <div className="collection-stats">
        <div><span>FLOOR PRICE</span><b>FREE MINT</b></div>
        <div><span>TOTAL SUPPLY</span><b>1,000</b></div>
        <div><span>MINTED</span><b>{pct.toFixed(1)}%</b></div>
        <div><span>YOUR COLLECTION</span><b>{mine}</b></div>
        <div><span>CONTRACT</span><b>{String(NFT_COLLECTION).slice(0, 4)}…{String(NFT_COLLECTION).slice(-3)}</b></div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {['All', 'Common', 'Uncommon', 'Rare', 'Epic'].map((x, i) => (
            <button key={x} className={i === 0 ? 'active' : ''}>{x}</button>
          ))}
        </div>
        <span className="count-chip toolbar spacer">1,000 ITEMS</span>
      </div>

      <div className="nft-grid">
        {Array.from({ length: shown }, (_, i) => nftCard(i))}
      </div>
      <button className="btn center-load" onClick={() => setShown((s) => s + 6)}>
        Load more · {shown}/1000
      </button>
    </>
  );
}
