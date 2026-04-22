import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import WalletConnector from './WalletConnector';
import TransactionDemo from './TransactionDemo';
import DatabaseMonitor from './DatabaseMonitor';
import blockchainService from '../services/blockchainService';
import { crm as C } from '../styles/crmTheme';

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Hero = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 1rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const HeroCard = styled.div`
  background:
    radial-gradient(circle at top right, rgba(0, 200, 150, 0.16), transparent 34%),
    linear-gradient(145deg, rgba(10, 10, 10, 0.98), rgba(18, 18, 18, 1));
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 1.5rem;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.24);
`;

const SideCard = styled.div`
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 1.5rem;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: ${C.accentBg};
  color: ${C.accent};
  border: 1px solid ${C.borderLight};
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1rem;
`;

const HeroTitle = styled.h2`
  margin: 0 0 0.75rem;
  color: ${C.text};
  font-size: 1.9rem;
  line-height: 1.08;
`;

const HeroCopy = styled.p`
  margin: 0;
  max-width: 760px;
  color: ${C.textMuted};
  font-size: 0.98rem;
  line-height: 1.7;
`;

const HeroStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.85rem;
  margin-top: 1.25rem;
`;

const StatPill = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 0.95rem 1rem;
`;

const StatLabel = styled.div`
  color: ${C.textMuted};
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
`;

const StatValue = styled.div`
  color: ${C.text};
  font-size: 1.2rem;
  font-weight: 800;
`;

const SideList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const SideRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: ${C.textMuted};
  font-size: 0.88rem;
`;

const SideValue = styled.span`
  color: ${C.text};
  font-weight: 700;
  text-align: right;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  grid-column: span ${({ $span = 12 }) => $span};
  background: ${C.surface};
  border: 1px solid ${C.border};
  border-radius: ${C.radiusLg};
  padding: 1.4rem;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);

  @media (max-width: 1080px) {
    grid-column: span 1;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${C.text};
  font-size: 1.15rem;
  font-weight: 700;
`;

const CardTitle = styled.h3`
  color: ${C.text};
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 700;
`;

const CardCopy = styled.p`
  margin: 0 0 1rem;
  color: ${C.textMuted};
  font-size: 0.88rem;
  line-height: 1.6;
`;

const MiniGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.85rem;
`;

const MiniMetric = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 0.95rem;
`;

const MiniValue = styled.div`
  color: ${C.text};
  font-size: 1.08rem;
  font-weight: 800;
  margin-bottom: 0.2rem;
`;

const MiniLabel = styled.div`
  color: ${C.textMuted};
  font-size: 0.8rem;
  line-height: 1.4;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.72rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  background: ${({ $status }) => ($status === 'healthy' ? C.successBg : C.dangerBg)};
  color: ${({ $status }) => ($status === 'healthy' ? C.success : C.danger)};
  border: 1px solid ${({ $status }) => ($status === 'healthy' ? `${C.success}44` : `${C.danger}44`)};
`;

const MarketList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const MarketRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(110px, 0.8fr) minmax(90px, 0.7fr);
  gap: 0.8rem;
  align-items: center;
  padding: 0.8rem 0.95rem;
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
`;

const CoinName = styled.div`
  color: ${C.text};
  font-size: 0.9rem;
  font-weight: 700;
`;

const CoinMeta = styled.div`
  color: ${C.textMuted};
  font-size: 0.76rem;
  margin-top: 0.2rem;
`;

const PriceText = styled.div`
  color: ${C.text};
  font-size: 0.9rem;
  font-weight: 700;
  text-align: right;
`;

const ChangeText = styled.div`
  color: ${({ $positive }) => ($positive ? C.success : C.danger)};
  font-size: 0.84rem;
  font-weight: 800;
  text-align: right;
`;

const StrategyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const StrategyCard = styled.div`
  background: ${C.card};
  border: 1px solid ${C.border};
  border-radius: ${C.radius};
  padding: 1rem;
`;

const StrategyTitle = styled.div`
  color: ${C.text};
  font-size: 0.92rem;
  font-weight: 700;
  margin-bottom: 0.35rem;
`;

const StrategyBody = styled.div`
  color: ${C.textMuted};
  font-size: 0.84rem;
  line-height: 1.55;
`;

const ErrorCard = styled(Card)`
  border-color: ${C.danger}55;
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(20, 20, 20, 0.96));
`;

const ErrorText = styled.p`
  margin: 0;
  color: ${C.text};
  font-size: 0.95rem;
  line-height: 1.5;
`;

const EmptyHint = styled.div`
  color: ${C.textMuted};
  font-size: 0.88rem;
  line-height: 1.6;
`;

const formatUsd = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: value >= 100 ? 0 : 2,
}).format(Number(value || 0));

const formatEth = (value) => `${Number(value || 0).toFixed(4)} ETH`;

const formatChange = (value) => {
  const amount = Number(value || 0);
  const prefix = amount >= 0 ? '+' : '';
  return `${prefix}${amount.toFixed(2)}%`;
};

const getWalletAgeLabel = (createdAt) => {
  if (!createdAt) {
    return 'New wallet';
  }

  const created = new Date(createdAt * 1000);
  const days = Math.max(1, Math.floor((Date.now() - created.getTime()) / 86400000));
  return days === 1 ? '1 day live' : `${days} days live`;
};

const strategyCards = [
  {
    title: 'Income Focus',
    body: 'Use affiliate commissions and lower-volatility treasury balances as your core engine. This works best when you want repeatable yield, visible payout rules, and tighter cash discipline.',
  },
  {
    title: 'Core + Reserve',
    body: 'Keep the wallet anchored around ETH and stablecoin awareness, then use escrow and commission tracking to understand liquidity before taking larger directional bets.',
  },
  {
    title: 'Opportunistic Rotation',
    body: 'Watch 24-hour momentum on majors, but size entries only after your operating wallet and payout runway are funded. This helps avoid mixing speculation with needed settlement funds.',
  },
];

const BlockchainWorkspace = ({ showHeader = true }) => {
  const [health, setHealth] = useState(null);
  const [protocolMetrics, setProtocolMetrics] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [priceMap, setPriceMap] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [affiliateSnapshot, setAffiliateSnapshot] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [healthData, commissionStats, escrowStats, prices, markets] = await Promise.all([
          blockchainService.getHealth(),
          blockchainService.getContractStats(),
          blockchainService.getEscrowStats(),
          blockchainService.getCryptoPriceMap(),
          blockchainService.getCryptoMarketSnapshot(),
        ]);

        if (!active) {
          return;
        }

        setHealth(healthData);
        setPriceMap(prices);
        setMarketData(markets);
        setProtocolMetrics({
          commissionPoolEth: commissionStats.contract_balance_eth || 0,
          commissionPoolUsd: (commissionStats.contract_balance_eth || 0) * (prices.ethereum?.usd || 0),
          totalPaidEth: commissionStats.total_paid_eth || 0,
          totalPaidUsd: (commissionStats.total_paid_eth || 0) * (prices.ethereum?.usd || 0),
          activeEscrows: escrowStats.active_escrows || 0,
          lockedValueEth: escrowStats.total_locked_value || 0,
          lockedValueUsd: (escrowStats.total_locked_value || 0) * (prices.ethereum?.usd || 0),
        });
        setLoadError('');
      } catch (error) {
        if (!active) {
          return;
        }
        setLoadError(error.message || 'Unable to load blockchain metrics.');
      }
    };

    load();
    const interval = setInterval(load, 45000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadWalletSnapshot = async () => {
      if (!connectedAddress) {
        setConnectedWallet(null);
        setAffiliateSnapshot(null);
        return;
      }

      try {
        const [walletDetails, affiliateBalance, affiliateStatus] = await Promise.all([
          blockchainService.getWalletDetails(connectedAddress),
          blockchainService.getAffiliateBalance(connectedAddress),
          blockchainService.getAffiliateStatus(connectedAddress),
        ]);

        if (!active) {
          return;
        }

        setConnectedWallet(walletDetails);
        setAffiliateSnapshot({
          balance_eth: affiliateBalance.balance_eth || 0,
          balance_usd: (affiliateBalance.balance_eth || 0) * (priceMap?.ethereum?.usd || 0),
          is_affiliate: Boolean(affiliateStatus.is_affiliate),
          is_merchant: Boolean(affiliateStatus.is_merchant),
        });
      } catch (error) {
        if (!active) {
          return;
        }
        setConnectedWallet(null);
        setAffiliateSnapshot(null);
      }
    };

    loadWalletSnapshot();
    const interval = setInterval(loadWalletSnapshot, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [connectedAddress, priceMap]);

  const walletSummary = useMemo(() => {
    if (!connectedWallet) {
      return null;
    }

    const ethPrice = priceMap?.ethereum?.usd || 0;
    const walletEth = Number(connectedWallet.eth_balance || 0);
    const walletUsd = walletEth * ethPrice;
    const commissionEth = Number(affiliateSnapshot?.balance_eth || 0);

    return {
      walletEth,
      walletUsd,
      commissionEth,
      commissionUsd: commissionEth * ethPrice,
      totalDepositsEth: Number(connectedWallet.total_deposits || 0),
      totalWithdrawalsEth: Number(connectedWallet.total_withdrawals || 0),
      walletAge: getWalletAgeLabel(connectedWallet.created_at),
      isAffiliate: Boolean(affiliateSnapshot?.is_affiliate),
      isMerchant: Boolean(affiliateSnapshot?.is_merchant),
    };
  }, [affiliateSnapshot, connectedWallet, priceMap]);

  const watchlistLead = marketData[0];

  return (
    <Section>
      {showHeader && <SectionTitle>Blockchain Operations</SectionTitle>}

      {loadError && (
        <ErrorCard $span={12}>
          <CardTitle>Connection Alert</CardTitle>
          <ErrorText>{loadError}</ErrorText>
        </ErrorCard>
      )}

      <Hero>
        <HeroCard>
          <Eyebrow>KimuX Fintech Desk</Eyebrow>
          <HeroTitle>Operate your wallet, track on-chain settlements, and watch the crypto market from one console.</HeroTitle>
          <HeroCopy>
            This workspace is designed to make the blockchain layer practical. You can connect a wallet, understand its current value,
            monitor protocol liquidity, compare live market prices, and then decide whether to focus on treasury safety, income, or more
            aggressive rotation strategies.
          </HeroCopy>

          <HeroStats>
            <StatPill>
              <StatLabel>ETH spot</StatLabel>
              <StatValue>{priceMap ? formatUsd(priceMap.ethereum?.usd) : 'Loading'}</StatValue>
            </StatPill>
            <StatPill>
              <StatLabel>ETH 24h</StatLabel>
              <StatValue>{priceMap ? formatChange(priceMap.ethereum?.change_24h) : 'Loading'}</StatValue>
            </StatPill>
            <StatPill>
              <StatLabel>Connected wallet</StatLabel>
              <StatValue>{connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : 'Not connected'}</StatValue>
            </StatPill>
            <StatPill>
              <StatLabel>Chain status</StatLabel>
              <StatValue>{health ? health.status : 'Loading'}</StatValue>
            </StatPill>
          </HeroStats>
        </HeroCard>

        <SideCard>
          <CardTitle>Operator Snapshot</CardTitle>
          <CardCopy>Use this as the quick read before you approve payouts, fund wallets, or create escrow.</CardCopy>
          <SideList>
            <SideRow>
              <span>Network</span>
              <SideValue>{blockchainService.networkLabel}</SideValue>
            </SideRow>
            <SideRow>
              <span>Latest block</span>
              <SideValue>{health?.latest_block ?? 'N/A'}</SideValue>
            </SideRow>
            <SideRow>
              <span>Gas price</span>
              <SideValue>{health?.gas_price_gwei ? `${health.gas_price_gwei.toFixed(2)} gwei` : 'N/A'}</SideValue>
            </SideRow>
            <SideRow>
              <span>Backend status</span>
              <SideValue><StatusBadge $status={health?.status || 'unhealthy'}>{health?.status || 'unknown'}</StatusBadge></SideValue>
            </SideRow>
            <SideRow>
              <span>Platform balance</span>
              <SideValue>{health?.platform_balance_eth ? formatEth(health.platform_balance_eth) : 'N/A'}</SideValue>
            </SideRow>
            <SideRow>
              <span>Market leader</span>
              <SideValue>{watchlistLead ? `${watchlistLead.symbol} ${formatChange(watchlistLead.price_change_percentage_24h)}` : 'Loading'}</SideValue>
            </SideRow>
          </SideList>
        </SideCard>
      </Hero>

      <Grid>
        <Card $span={4}>
          <CardTitle>Wallet Dashboard</CardTitle>
          <CardCopy>
            A concise view of the connected wallet so the user can understand working capital, claimable commission balance, and wallet tenure.
          </CardCopy>
          {walletSummary ? (
            <MiniGrid>
              <MiniMetric>
                <MiniValue>{formatEth(walletSummary.walletEth)}</MiniValue>
                <MiniLabel>Wallet ETH balance</MiniLabel>
              </MiniMetric>
              <MiniMetric>
                <MiniValue>{formatUsd(walletSummary.walletUsd)}</MiniValue>
                <MiniLabel>Wallet USD value</MiniLabel>
              </MiniMetric>
              <MiniMetric>
                <MiniValue>{formatEth(walletSummary.commissionEth)}</MiniValue>
                <MiniLabel>Claimable commission</MiniLabel>
              </MiniMetric>
              <MiniMetric>
                <MiniValue>{formatUsd(walletSummary.commissionUsd)}</MiniValue>
                <MiniLabel>Commission USD value</MiniLabel>
              </MiniMetric>
              <MiniMetric>
                <MiniValue>{walletSummary.walletAge}</MiniValue>
                <MiniLabel>Wallet age</MiniLabel>
              </MiniMetric>
              <MiniMetric>
                <MiniValue>{walletSummary.isAffiliate ? 'Affiliate' : 'Standard'}</MiniValue>
                <MiniLabel>{walletSummary.isMerchant ? 'Merchant access active' : 'Merchant access inactive'}</MiniLabel>
              </MiniMetric>
            </MiniGrid>
          ) : (
            <EmptyHint>Connect MetaMask to see wallet value, commission balance, and a cleaner operating summary.</EmptyHint>
          )}
        </Card>

        <Card $span={4}>
          <CardTitle>Protocol Liquidity</CardTitle>
          <CardCopy>
            These metrics help users separate their own wallet capital from the broader KimuX settlement environment.
          </CardCopy>
          <MiniGrid>
            <MiniMetric>
              <MiniValue>{protocolMetrics ? formatEth(protocolMetrics.commissionPoolEth) : 'Loading'}</MiniValue>
              <MiniLabel>Commission pool</MiniLabel>
            </MiniMetric>
            <MiniMetric>
              <MiniValue>{protocolMetrics ? formatUsd(protocolMetrics.commissionPoolUsd) : 'Loading'}</MiniValue>
              <MiniLabel>Commission pool USD</MiniLabel>
            </MiniMetric>
            <MiniMetric>
              <MiniValue>{protocolMetrics ? String(protocolMetrics.activeEscrows) : 'Loading'}</MiniValue>
              <MiniLabel>Active escrows</MiniLabel>
            </MiniMetric>
            <MiniMetric>
              <MiniValue>{protocolMetrics ? formatUsd(protocolMetrics.lockedValueUsd) : 'Loading'}</MiniValue>
              <MiniLabel>Escrow value locked</MiniLabel>
            </MiniMetric>
          </MiniGrid>
        </Card>

        <Card $span={4}>
          <CardTitle>Strategy Playbook</CardTitle>
          <CardCopy>
            The page should not only show transactions. It should help users decide how to use the wallet responsibly.
          </CardCopy>
          <StrategyList>
            {strategyCards.map((strategy) => (
              <StrategyCard key={strategy.title}>
                <StrategyTitle>{strategy.title}</StrategyTitle>
                <StrategyBody>{strategy.body}</StrategyBody>
              </StrategyCard>
            ))}
          </StrategyList>
        </Card>

        <Card $span={7}>
          <CardTitle>Crypto Market Pulse</CardTitle>
          <CardCopy>
            Live spot pricing gives users practical context for wallet value, treasury sizing, and how aggressive their next move should be.
          </CardCopy>
          {marketData.length ? (
            <MarketList>
              {marketData.map((coin) => (
                <MarketRow key={coin.id}>
                  <div>
                    <CoinName>{coin.name}</CoinName>
                    <CoinMeta>{coin.symbol} | Rank #{coin.market_cap_rank}</CoinMeta>
                  </div>
                  <PriceText>{formatUsd(coin.current_price)}</PriceText>
                  <ChangeText $positive={coin.price_change_percentage_24h >= 0}>
                    {formatChange(coin.price_change_percentage_24h)}
                  </ChangeText>
                </MarketRow>
              ))}
            </MarketList>
          ) : (
            <EmptyHint>Live crypto pricing is loading. If the market API is unavailable, wallet and transaction tools still work.</EmptyHint>
          )}
        </Card>

        <Card $span={5}>
          <CardTitle>Practical Guidance</CardTitle>
          <CardCopy>
            A short checklist to keep the user flow intentional rather than purely experimental.
          </CardCopy>
          <StrategyList>
            <StrategyCard>
              <StrategyTitle>1. Fund the operating wallet first</StrategyTitle>
              <StrategyBody>Make sure the wallet has enough ETH for settlement actions and gas before attempting transfers, commission withdrawals, or escrow creation.</StrategyBody>
            </StrategyCard>
            <StrategyCard>
              <StrategyTitle>2. Separate operating cash from speculation</StrategyTitle>
              <StrategyBody>Use the wallet dashboard and market pulse together. If balances are needed for payments or escrow, avoid overcommitting to higher-volatility moves.</StrategyBody>
            </StrategyCard>
            <StrategyCard>
              <StrategyTitle>3. Watch payouts against market conditions</StrategyTitle>
              <StrategyBody>When ETH is moving quickly, USD-denominated value can swing even if your on-chain ETH balance stays constant. This page helps users see that clearly.</StrategyBody>
            </StrategyCard>
          </StrategyList>
        </Card>
      </Grid>

      <SectionTitle>Wallet Management</SectionTitle>
      <WalletConnector onWalletConnected={(address, details) => {
        setConnectedAddress(address);
        setConnectedWallet(details);
      }} />

      {connectedAddress && (
        <>
          <SectionTitle>Transaction Operations</SectionTitle>
          <TransactionDemo connectedAddress={connectedAddress} />

          <SectionTitle>Settlement Activity</SectionTitle>
          <DatabaseMonitor connectedAddress={connectedAddress} autoRefresh={true} />
        </>
      )}
    </Section>
  );
};

export default BlockchainWorkspace;
