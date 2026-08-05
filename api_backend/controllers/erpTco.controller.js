const MARKET_BENCHMARKS = {
  'SAP S/4 HANA': {
    savings: 0.3,
    breakeven: 18,
    risk: 'high-cost-modern-core',
    rationale: 'Suite enterprise moderna con costo alto de licenciamiento, soporte especializado y oportunidades claras de racionalizacion.',
  },
  'SAP ECC': {
    savings: 0.35,
    breakeven: 16,
    risk: 'legacy-deadline-pressure',
    rationale: 'ERP legacy con presion de modernizacion, costos de soporte crecientes y alto potencial de simplificacion operativa.',
  },
  'Oracle EBS R12': {
    savings: 0.25,
    breakeven: 14,
    risk: 'oracle-modernization',
    rationale: 'Base Oracle con camino natural hacia Fusion, menor friccion funcional y buen potencial de continuidad tecnica.',
  },
  'Oracle JD Edwards': {
    savings: 0.2,
    breakeven: 12,
    risk: 'distributed-legacy',
    rationale: 'Ambientes maduros con procesos distribuidos; el ahorro depende de consolidacion e integraciones.',
  },
  'Oracle PeopleSoft': {
    savings: 0.22,
    breakeven: 14,
    risk: 'specialized-legacy',
    rationale: 'Plataforma estable pero especializada; el caso mejora cuando hay presion por talento, soporte o reporting.',
  },
  'Microsoft Dynamics 365': {
    savings: 0.28,
    breakeven: 18,
    risk: 'platform-comparison',
    rationale: 'El caso depende de alcance financiero, integraciones y gobierno de datos frente a stack Microsoft existente.',
  },
  NetSuite: {
    savings: 0.15,
    breakeven: 20,
    risk: 'midmarket-fit',
    rationale: 'Suele tener menor costo base; el caso Oracle requiere complejidad operativa, expansion o control financiero superior.',
  },
  'Otro / Greenfield': {
    savings: 0.3,
    breakeven: 18,
    risk: 'greenfield-standardization',
    rationale: 'Caso abierto donde el potencial depende de estandarizacion, volumen transaccional y urgencia de control.',
  },
};

const INDUSTRY_MULTIPLIER = {
  'Servicios financieros': 1.08,
  'Inmobiliario / Centros comerciales': 1.06,
  'Logistica / Distribucion / Transporte': 1.05,
  Otra: 1,
};

const MARKET_COST_PER_USER = {
  'SAP S/4 HANA': 4200,
  'SAP ECC': 3900,
  'Oracle EBS R12': 3400,
  'Oracle JD Edwards': 3000,
  'Oracle PeopleSoft': 3200,
  'Microsoft Dynamics 365': 2800,
  NetSuite: 2200,
  'Otro / Greenfield': 2500,
};

const INDUSTRY_COST_MULTIPLIER = {
  'Servicios financieros': 1.12,
  'Inmobiliario / Centros comerciales': 1.07,
  'Logistica / Distribucion / Transporte': 1.06,
  Otra: 1,
};

const TRANSACTION_MULTIPLIER = {
  '<10K': 0.96,
  '10K-100K': 1,
  '100K-1M': 1.06,
  '>1M': 1.12,
};

const PAIN_MULTIPLIER = {
  'Costo total demasiado alto': 1.08,
  'Reportes financieros lentos o manuales': 1.04,
  'Cierre contable complejo': 1.06,
  'Soporte caro o poco disponible': 1.05,
  'Obsolescencia / riesgo de continuidad': 1.07,
  'Solo explorando': 0.96,
};

const TIMELINE_SCORE = {
  '0-3 meses': 22,
  '3-6 meses': 16,
  '6-12 meses': 9,
  'Solo explorando': 3,
};

const TARGET_SCORE = {
  'Oracle Fusion Cloud': 18,
  'OCI + Oracle Fusion': 16,
  'Comparar Oracle contra otras opciones': 12,
  'No definido': 4,
};

function asNumber(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, next);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBenchmark(erp) {
  return MARKET_BENCHMARKS[erp] || MARKET_BENCHMARKS['Otro / Greenfield'];
}

function inferTransactionVolume(users) {
  if (users >= 1000) return '>1M';
  if (users >= 250) return '100K-1M';
  if (users >= 75) return '10K-100K';
  return '<10K';
}

function inferPain(erp) {
  if (erp === 'SAP ECC' || erp === 'Oracle JD Edwards' || erp === 'Oracle PeopleSoft') {
    return 'Obsolescencia / riesgo de continuidad';
  }

  if (erp === 'NetSuite') return 'Reportes financieros lentos o manuales';
  return 'Costo total demasiado alto';
}

function calculateMarketTco(payload) {
  const erp = payload.erp || 'Otro / Greenfield';
  const industry = payload.industry || 'Otra';
  const benchmark = getBenchmark(erp);
  const users = clamp(asNumber(payload.users), 1, 50000);
  const licenseCost = asNumber(payload.licenseCost);
  const infraCost = asNumber(payload.infraCost);
  const supportCost = asNumber(payload.supportCost);
  const knownAnnualSpend = asNumber(payload.annualErpSpend || payload.annualSpend || payload.totalAnnualCost);
  const explicitAnnualCost = knownAnnualSpend > 0 ? knownAnnualSpend : licenseCost + infraCost + supportCost;
  const marketCostPerUser = MARKET_COST_PER_USER[erp] || MARKET_COST_PER_USER['Otro / Greenfield'];
  const marketAnnualCost = Math.round(users * marketCostPerUser * (INDUSTRY_COST_MULTIPLIER[industry] || 1));
  
  // Lógica de costo mínimo operativo estimado (ej. mínimo $5k o $150 por usuario)
  const minOperatingCost = Math.max(5000, users * 150);
  const isCostAbnormallyLow = explicitAnnualCost > 0 && explicitAnnualCost < minOperatingCost;

  const totalAnnualCost = (explicitAnnualCost > 0 && !isCostAbnormallyLow) ? explicitAnnualCost : marketAnnualCost;
  const costSource = (explicitAnnualCost > 0 && !isCostAbnormallyLow) ? 'provided' : 'market';
  
  const monthlyTransactions = payload.monthlyTransactions || inferTransactionVolume(users);
  const primaryPain = payload.primaryPain || inferPain(erp);
  const decisionTimeline = payload.decisionTimeline || '6-12 meses';
  const targetScenario = payload.targetScenario || 'Oracle Fusion Cloud';
  const industryMultiplier = INDUSTRY_MULTIPLIER[industry] || 1;
  const transactionMultiplier = TRANSACTION_MULTIPLIER[monthlyTransactions] || 1;
  const painMultiplier = PAIN_MULTIPLIER[primaryPain] || 1;
  const adjustedSavingsRate = clamp(
    benchmark.savings * industryMultiplier * transactionMultiplier * painMultiplier,
    0.08,
    0.42
  );
  const annualSavings = totalAnnualCost * adjustedSavingsRate;
  const oracleAnnualCost = totalAnnualCost - annualSavings;
  const migrationInvestment = Math.max(totalAnnualCost * 0.42, users * 1200, 85000);
  const breakeven = annualSavings > 0
    ? Math.max(6, Math.ceil((migrationInvestment / annualSavings) * 12))
    : benchmark.breakeven;
  const urgencyScore = TIMELINE_SCORE[decisionTimeline] || 0;
  const targetScore = TARGET_SCORE[targetScenario] || 0;
  const costScore = totalAnnualCost >= 1000000 ? 25 : totalAnnualCost >= 500000 ? 20 : totalAnnualCost >= 250000 ? 14 : 8;
  const volumeScore = monthlyTransactions === '>1M' ? 14 : monthlyTransactions === '100K-1M' ? 10 : 5;
  const painScore = primaryPain && primaryPain !== 'Solo explorando' ? 12 : 3;
  const qualificationScore = clamp(costScore + urgencyScore + targetScore + volumeScore + painScore, 0, 100);

  return {
    totalAnnualCost,
    oracleAnnualCost,
    currentTCO1y: totalAnnualCost,
    currentTCO3y: totalAnnualCost * 3,
    currentTCO5y: totalAnnualCost * 5,
    currentTCO10y: totalAnnualCost * 10,
    oracleTCO1y: oracleAnnualCost,
    oracleTCO3y: oracleAnnualCost * 3,
    oracleTCO5y: oracleAnnualCost * 5,
    oracleTCO10y: oracleAnnualCost * 10,
    annualSavings,
    savings5y: annualSavings * 5,
    savings10y: annualSavings * 10,
    migrationInvestment,
    breakeven,
    percentReduction: adjustedSavingsRate * 100,
    qualificationScore,
    market: {
      erp,
      industry,
      risk: benchmark.risk,
      rationale: benchmark.rationale,
      annualCostAssumption: marketAnnualCost,
      costPerUserAssumption: marketCostPerUser,
      costSource,
      isCostAbnormallyLow,
      enteredAnnualCost: explicitAnnualCost,
      minOperatingCost,
      savingsRateBase: benchmark.savings,
      savingsRateAdjusted: adjustedSavingsRate,
      inferred: {
        monthlyTransactions,
        primaryPain,
        decisionTimeline,
        targetScenario,
      },
      multipliers: {
        industry: industryMultiplier,
        transactions: transactionMultiplier,
        pain: painMultiplier,
      },
    },
    recommendation: buildRecommendation({
      score: qualificationScore,
      breakeven,
      annualSavings,
      targetScenario,
      decisionTimeline,
    }),
  };
}

function buildRecommendation({ score, breakeven, annualSavings, targetScenario, decisionTimeline }) {
  if (score >= 75) {
    return {
      level: 'Alta prioridad',
      nextStep: 'Preparar TCO Comparator privado con supuestos financieros y arquitectura objetivo.',
      summary: `Caso fuerte: ahorro anual potencial de USD ${Math.round(annualSavings).toLocaleString('en-US')} y breakeven aproximado de ${breakeven} meses.`,
    };
  }

  if (score >= 50) {
    return {
      level: 'Evaluacion recomendada',
      nextStep: 'Validar costos reales, contratos, integraciones y ventanas de decision.',
      summary: `Hay senales razonables para comparar. El escenario ${targetScenario || 'no definido'} y plazo ${decisionTimeline || 'no definido'} deben confirmarse.`,
    };
  }

  return {
    level: 'Exploratorio',
    nextStep: 'Mantener como lectura inicial y pedir mas contexto antes de una sesion senior.',
    summary: 'El caso todavia necesita mas urgencia, costo o claridad de objetivo para justificar una revision profunda.',
  };
}

exports.calculate = (req, res) => {
  try {
    const result = calculateMarketTco(req.body || {});
    res.json({ ok: true, result });
  } catch (err) {
    console.error('erpTco.calculate error:', err);
    res.status(500).json({ error: 'No se pudo calcular el TCO de mercado.' });
  }
};

exports.calculateMarketTco = calculateMarketTco;
