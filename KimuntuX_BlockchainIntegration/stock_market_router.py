# routers/stock_market.py
# Stock Market Integration Router with AI Predictions

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from config.database import get_db
from services.stock_market.market_data import MarketDataService
from services.stock_market.ai_predictor import StockPredictor
from services.stock_market.portfolio import PortfolioService
from services.stock_market.broker_integration import BrokerIntegration
from models.stock_market import StockPortfolio, StockTransaction, StockPrediction
from middleware.auth import get_current_user

router = APIRouter()

# ============ Pydantic Models ============

class StockSymbol(BaseModel):
    """Stock symbol request"""
    symbol: str = Field(..., description="Stock ticker symbol (e.g., AAPL, TSLA)")
    exchange: Optional[str] = Field("NASDAQ", description="Exchange name")

class StockQuoteResponse(BaseModel):
    """Real-time stock quote"""
    symbol: str
    company_name: str
    current_price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    day_high: float
    day_low: float
    open_price: float
    previous_close: float
    timestamp: datetime

class AIMarketInsight(BaseModel):
    """AI-generated market insight"""
    symbol: str
    prediction: str  # "bullish", "bearish", "neutral"
    confidence: float  # 0-1
    target_price: float
    time_horizon: str  # "1d", "1w", "1m", "3m"
    reasoning: str
    risk_level: str  # "low", "medium", "high"
    recommendation: str  # "strong_buy", "buy", "hold", "sell", "strong_sell"
    generated_at: datetime

class PortfolioCreate(BaseModel):
    """Create new portfolio"""
    name: str
    description: Optional[str]
    goal: str  # "growth", "stability", "income"
    risk_tolerance: str  # "conservative", "moderate", "aggressive"
    initial_capital: float

class StockOrder(BaseModel):
    """Stock order request"""
    symbol: str
    quantity: int = Field(..., gt=0)
    order_type: str = Field(..., description="market, limit, stop_loss")
    side: str = Field(..., description="buy or sell")
    limit_price: Optional[float] = None
    stop_price: Optional[float] = None
    portfolio_id: int

class PortfolioRebalance(BaseModel):
    """Portfolio rebalancing recommendation"""
    portfolio_id: int
    recommendations: List[dict]
    expected_return: float
    risk_score: float
    diversification_score: float

# ============ Market Data Endpoints ============

@router.get("/quote/{symbol}", response_model=StockQuoteResponse)
async def get_stock_quote(
    symbol: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get real-time stock quote
    """
    try:
        market_service = MarketDataService()
        quote = await market_service.get_real_time_quote(symbol)
        
        if not quote:
            raise HTTPException(
                status_code=404,
                detail=f"Stock symbol {symbol} not found"
            )
        
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching quote: {str(e)}"
        )

@router.get("/quotes/multiple")
async def get_multiple_quotes(
    symbols: List[str] = Query(..., description="List of stock symbols"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get quotes for multiple stocks
    """
    try:
        market_service = MarketDataService()
        quotes = await market_service.get_batch_quotes(symbols)
        return {"quotes": quotes}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching quotes: {str(e)}"
        )

@router.get("/historical/{symbol}")
async def get_historical_data(
    symbol: str,
    period: str = Query("1mo", description="1d, 5d, 1mo, 3mo, 6mo, 1y, 5y"),
    interval: str = Query("1d", description="1m, 5m, 15m, 1d, 1wk, 1mo"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get historical stock data for charting
    """
    try:
        market_service = MarketDataService()
        data = await market_service.get_historical_data(symbol, period, interval)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching historical data: {str(e)}"
        )

# ============ AI Prediction Endpoints ============

@router.post("/predict/{symbol}", response_model=AIMarketInsight)
async def get_ai_prediction(
    symbol: str,
    time_horizon: str = Query("1w", description="Prediction timeframe"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get AI-powered stock price prediction and analysis
    """
    try:
        predictor = StockPredictor()
        
        # Get prediction
        prediction = await predictor.predict_stock_movement(
            symbol=symbol,
            time_horizon=time_horizon
        )
        
        # Save prediction to database (background task)
        background_tasks.add_task(
            save_prediction_to_db,
            db, current_user.id, prediction
        )
        
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating prediction: {str(e)}"
        )

@router.get("/market-analysis")
async def get_market_analysis(
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get AI-powered market analysis and top opportunities
    """
    try:
        predictor = StockPredictor()
        market_service = MarketDataService()
        
        # Get market overview
        market_overview = await market_service.get_market_overview()
        
        # Get AI insights for sectors
        insights = await predictor.analyze_market_trends(sector)
        
        # Get top opportunities
        opportunities = await predictor.get_top_opportunities(
            sector=sector,
            risk_level=current_user.risk_tolerance
        )
        
        return {
            "market_overview": market_overview,
            "ai_insights": insights,
            "top_opportunities": opportunities,
            "generated_at": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing market: {str(e)}"
        )

@router.get("/trending")
async def get_trending_stocks(
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get trending stocks with AI analysis
    """
    try:
        market_service = MarketDataService()
        predictor = StockPredictor()
        
        # Get trending stocks
        trending = await market_service.get_trending_stocks(limit)
        
        # Add AI insights for each
        for stock in trending:
            insight = await predictor.quick_analysis(stock["symbol"])
            stock["ai_insight"] = insight
        
        return {"trending_stocks": trending}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching trending stocks: {str(e)}"
        )

# ============ Portfolio Management ============

@router.post("/portfolio/create")
async def create_portfolio(
    portfolio: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new investment portfolio
    """
    try:
        portfolio_service = PortfolioService(db)
        
        new_portfolio = await portfolio_service.create_portfolio(
            user_id=current_user.id,
            **portfolio.dict()
        )
        
        # Get AI-recommended initial allocation
        predictor = StockPredictor()
        allocation = await predictor.recommend_initial_allocation(
            goal=portfolio.goal,
            risk_tolerance=portfolio.risk_tolerance,
            capital=portfolio.initial_capital
        )
        
        return {
            "portfolio": new_portfolio,
            "ai_recommended_allocation": allocation
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating portfolio: {str(e)}"
        )

@router.get("/portfolio/{portfolio_id}")
async def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get portfolio details with current values
    """
    try:
        portfolio_service = PortfolioService(db)
        
        portfolio = await portfolio_service.get_portfolio_with_values(
            portfolio_id=portfolio_id,
            user_id=current_user.id
        )
        
        if not portfolio:
            raise HTTPException(
                status_code=404,
                detail="Portfolio not found"
            )
        
        return portfolio
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching portfolio: {str(e)}"
        )

@router.get("/portfolio/{portfolio_id}/rebalance")
async def get_rebalance_recommendations(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get AI-powered portfolio rebalancing recommendations
    """
    try:
        portfolio_service = PortfolioService(db)
        predictor = StockPredictor()
        
        # Get current portfolio
        portfolio = await portfolio_service.get_portfolio_with_values(
            portfolio_id, current_user.id
        )
        
        # Get rebalancing recommendations
        recommendations = await predictor.recommend_rebalancing(portfolio)
        
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )

# ============ Trading Endpoints ============

@router.post("/order/place")
async def place_order(
    order: StockOrder,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Place a stock order through connected broker
    """
    try:
        broker = BrokerIntegration(current_user.broker_credentials)
        portfolio_service = PortfolioService(db)
        
        # Verify portfolio ownership
        portfolio = await portfolio_service.get_portfolio(
            order.portfolio_id, current_user.id
        )
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        # Execute order
        result = await broker.execute_order(
            symbol=order.symbol,
            quantity=order.quantity,
            order_type=order.order_type,
            side=order.side,
            limit_price=order.limit_price,
            stop_price=order.stop_price
        )
        
        # Record transaction
        transaction = await portfolio_service.record_transaction(
            portfolio_id=order.portfolio_id,
            **result
        )
        
        return {
            "order_id": result["order_id"],
            "status": result["status"],
            "transaction_id": transaction.id,
            "message": "Order placed successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error placing order: {str(e)}"
        )

@router.get("/orders/{portfolio_id}")
async def get_order_history(
    portfolio_id: int,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get order history for a portfolio
    """
    try:
        portfolio_service = PortfolioService(db)
        
        orders = await portfolio_service.get_order_history(
            portfolio_id=portfolio_id,
            user_id=current_user.id,
            limit=limit
        )
        
        return {"orders": orders}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching orders: {str(e)}"
        )

# ============ Market Alerts ============

@router.post("/alerts/create")
async def create_price_alert(
    symbol: str,
    target_price: float,
    condition: str = Query(..., description="above or below"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a price alert for a stock
    """
    try:
        # Implementation for price alerts
        # This would typically involve a background service
        pass
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating alert: {str(e)}"
        )

# ============ Helper Functions ============

async def save_prediction_to_db(db: Session, user_id: int, prediction: dict):
    """Save AI prediction to database for tracking accuracy"""
    try:
        db_prediction = StockPrediction(
            user_id=user_id,
            symbol=prediction["symbol"],
            predicted_direction=prediction["prediction"],
            confidence=prediction["confidence"],
            target_price=prediction["target_price"],
            time_horizon=prediction["time_horizon"],
            reasoning=prediction["reasoning"],
            created_at=datetime.utcnow()
        )
        db.add(db_prediction)
        db.commit()
    except Exception as e:
        print(f"Error saving prediction: {e}")
        db.rollback()
