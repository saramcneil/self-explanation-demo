import React, { useState } from 'react';
import { AlertCircle, Sparkles, Lightbulb, Search, CheckCircle, Loader } from 'lucide-react';

const AIPoweredSelfExplanation = () => {
  const [userExplanation, setUserExplanation] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExpert, setShowExpert] = useState(false);
  const [hintsRequested, setHintsRequested] = useState(0);
  const [currentHint, setCurrentHint] = useState(null);

  const contentData = {
    title: "Glomerular Filtration Rate and Starling Forces",
    text: `Glomerular filtration rate (GFR) represents the volume of plasma filtered by the glomeruli per unit time. GFR is determined by the balance of Starling forces across the glomerular capillary: the hydrostatic pressure favoring filtration (approximately 60 mmHg in glomerular capillaries) minus the opposing forces of Bowman's capsule hydrostatic pressure (approximately 15 mmHg) and oncotic pressure from plasma proteins (approximately 29 mmHg). The net filtration pressure is therefore approximately 16 mmHg.`,
    prompt: "Explain in your own words how Starling forces determine GFR. Why would severe dehydration decrease GFR? How would you expect bilateral renal artery stenosis to affect these forces?",
    expertExplanation: "GFR depends on the net pressure pushing fluid from the glomerular capillaries into Bowman's capsule. The main driving force is the high hydrostatic pressure in the glomerular capillaries (60 mmHg), which is opposed by the pressure in Bowman's capsule (15 mmHg) and the oncotic pressure from proteins that can't cross the filter (29 mmHg). This gives about 16 mmHg of net pressure. In severe dehydration, blood volume drops, which decreases cardiac output and therefore decreases the pressure in the glomerular capillaries - so P_GC drops and GFR falls. With bilateral renal artery stenosis, the pressure reaching the glomeruli would be reduced because of the narrowed arteries upstream, again decreasing P_GC. However, the kidneys would sense decreased perfusion and activate RAAS, causing systemic hypertension - but the stenosis would still limit pressure transmission to the glomeruli.",
    keyConceptsToCheck: {
      critical: [
        "NFP = driving pressure minus opposing pressures",
        "P_GC (~60 mmHg) is the main driving force",
        "Dehydration decreases P_GC via reduced cardiac output",
        "Stenosis reduces pressure transmission to glomeruli"
      ],
      advanced: [
        "Mentions cardiac output connection",
        "Discusses RAAS activation",
        "Distinguishes pre-glomerular from glomerular pressure"
      ],
      commonMisconceptions: [
        "Thinking filtration requires active transport",
        "Confusing decreased blood volume with increased oncotic pressure",
        "Believing stenosis increases glomerular pressure"
      ]
    }
  };

  const generateFeedbackPrompt = () => {
    return `You are an expert medical educator providing feedback on a student's self-explanation.

LEARNING CONTENT:
${contentData.text}

PROMPT GIVEN TO STUDENT:
${contentData.prompt}

STUDENT'S SELF-EXPLANATION:
"${userExplanation}"

CRITICAL CONCEPTS TO ASSESS:
${JSON.stringify(contentData.keyConceptsToCheck.critical)}

COMMON MISCONCEPTIONS TO CHECK:
${JSON.stringify(contentData.keyConceptsToCheck.commonMisconceptions)}

Analyze the student's explanation and provide feedback in JSON format with NO markdown formatting, no code blocks, just pure JSON:

{
  "strengths": [
    {
      "type": "mechanistic_reasoning",
      "content": "Specific praise referencing what they wrote"
    }
  ],
  "misconceptions": [
    {
      "studentStatement": "Quote their exact misconception",
      "correction": "Explain the correct concept",
      "reasoning": "Why this matters clinically"
    }
  ],
  "gaps": [
    {
      "missing": "What concept they didn't address",
      "suggestion": "Gentle prompt to consider this",
      "optional": true
    }
  ],
  "extensionQuestions": [
    {
      "question": "Thought-provoking follow-up"
    }
  ],
  "overallAssessment": {
    "understandingLevel": "strong",
    "encouragement": "Personalized encouraging message"
  }
}

FEEDBACK GUIDELINES:
1. Quote their specific words when praising or correcting
2. Be encouraging but honest about misconceptions
3. If they wrote very little, encourage more elaboration
4. If they're wrong about core concepts, prioritize correcting those
5. If they show strong understanding, push them to deeper insights
6. Be specific and reference their actual explanation

YOUR RESPONSE MUST BE ONLY VALID JSON. DO NOT include markdown code blocks or any other formatting.`;
  };

  const generateHintPrompt = () => {
    const hintLevel = hintsRequested + 1;
    return `The student is working on this self-explanation prompt:
"${contentData.prompt}"

Learning content: ${contentData.text}

They've requested hint ${hintLevel} of 3.

Provide a hint in JSON format with NO markdown:

{
  "hint": "your hint text here"
}

Guidelines based on hint level:
- Hint 1: Ask a guiding question to help them think about the key mechanism
- Hint 2: Provide a relevant analogy or concrete example
- Hint 3: Give more direct guidance about what to include, but don't give the full answer

YOUR RESPONSE MUST BE ONLY VALID JSON.`;
  };

  const requestHint = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: generateHintPrompt()
          }]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const hintData = JSON.parse(responseText);
      setCurrentHint(hintData.hint);
      setHintsRequested(prev => prev + 1);
    } catch (error) {
      console.error("Error getting hint:", error);
      setCurrentHint("Try breaking down the problem: What creates pressure? What opposes it? What's the net effect?");
    }
    setLoading(false);
  };

  const submitExplanation = async () => {
    if (!userExplanation.trim()) {
      alert("Please write your explanation first!");
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: generateFeedbackPrompt()
          }]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const feedbackJSON = JSON.parse(responseText);
      setFeedback(feedbackJSON);
    } catch (error) {
      console.error("Error getting feedback:", error);
      alert("Error getting feedback. Please try again.");
    }

    setLoading(false);
  };

  const FeedbackTypeIcon = ({ type }) => {
    const icons = {
      mechanistic_reasoning: Sparkles,
      clinical_application: CheckCircle,
      integration: CheckCircle,
      quantitative: CheckCircle
    };
    const Icon = icons[type] || Sparkles;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-900 mb-2">
            🧠 AI-Powered Self-Explanation
          </h1>
          <p className="text-gray-600">Get personalized feedback on your understanding</p>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-purple-900 mb-4">{contentData.title}</h2>
          <p className="text-gray-800 leading-relaxed mb-4">{contentData.text}</p>
          
          <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
            <p className="font-semibold text-purple-800 mb-2">📝 Your Task:</p>
            <p className="text-gray-700">{contentData.prompt}</p>
          </div>
        </div>

        {hintsRequested < 3 && !feedback && (
          <div className="mb-4">
            <button
              onClick={requestHint}
              disabled={loading}
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
            >
              <Lightbulb className="w-5 h-5" />
              {loading ? "Getting hint..." : `Need a hint? (${hintsRequested}/3 used)`}
            </button>
          </div>
        )}

        {currentHint && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Hint {hintsRequested}:</p>
                <p className="text-gray-700">{currentHint}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Your Explanation:
          </label>
          <textarea
            value={userExplanation}
            onChange={(e) => setUserExplanation(e.target.value)}
            placeholder="Write your explanation here. Take your time to think through the concepts and explain them in your own words..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none min-h-[200px] text-gray-800"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-2">
            Tip: Aim for 3-5 sentences. Explain the mechanism, not just facts.
          </p>
        </div>

        <button
          onClick={submitExplanation}
          disabled={loading || !userExplanation.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Analyzing your explanation...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Get AI Feedback
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">
            📊 Your Personalized Feedback
          </h2>

          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="space-y-3">
              {feedback.strengths.map((strength, i) => (
                <div key={i} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FeedbackTypeIcon type={strength.type} />
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">
                        {strength.type === 'mechanistic_reasoning' && '✨ Excellent mechanistic reasoning!'}
                        {strength.type === 'clinical_application' && '🏥 Strong clinical application!'}
                        {strength.type === 'integration' && '🔗 Great integration!'}
                        {strength.type === 'quantitative' && '📊 Solid quantitative thinking!'}
                      </p>
                      <p className="text-gray-700">{strength.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {feedback.misconceptions && feedback.misconceptions.length > 0 && (
            <div className="space-y-3">
              {feedback.misconceptions.map((misc, i) => (
                <div key={i} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900 mb-2">⚠️ Let's refine this:</p>
                      <p className="text-gray-700 mb-2">
                        You said: <em>"{misc.studentStatement}"</em>
                      </p>
                      <p className="text-gray-800 mb-2">{misc.correction}</p>
                      {misc.reasoning && (
                        <p className="text-gray-700">
                          <strong>Why this matters:</strong> {misc.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {feedback.gaps && feedback.gaps.length > 0 && (
            <div className="space-y-3">
              {feedback.gaps.map((gap, i) => (
                <div key={i} className={`border-l-4 p-4 rounded-lg ${
                  gap.optional 
                    ? 'bg-purple-50 border-purple-500' 
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-start gap-3">
                    {gap.optional ? (
                      <Search className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    ) : (
                      <Lightbulb className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold mb-1" style={{color: gap.optional ? '#7c3aed' : '#d97706'}}>
                        {gap.optional ? '🔍 Extension:' : '💡 Consider:'}
                      </p>
                      <p className="text-gray-700">{gap.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {feedback.extensionQuestions && feedback.extensionQuestions.length > 0 && (
            <div className="space-y-3">
              {feedback.extensionQuestions.map((ext, i) => (
                <div key={i} className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-purple-900 mb-1">🔍 Extension question:</p>
                      <p className="text-gray-700">{ext.question}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {feedback.overallAssessment && (
            <div className="bg-green-50 border-2 border-green-300 p-6 rounded-lg">
              <p className="text-gray-800 text-lg">{feedback.overallAssessment.encouragement}</p>
            </div>
          )}

          <div className="pt-4 border-t-2 border-gray-200">
            <button
              onClick={() => setShowExpert(!showExpert)}
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {showExpert ? 'Hide' : 'Compare with'} Expert Explanation
            </button>

            {showExpert && (
              <div className="mt-4 bg-gray-50 border-2 border-gray-300 p-6 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-3">Expert Explanation:</h4>
                <p className="text-gray-700 leading-relaxed mb-4">{contentData.expertExplanation}</p>
                <div className="bg-white p-4 rounded border-l-4 border-purple-500">
                  <p className="font-semibold text-purple-900 mb-2">Notice how the expert:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Traces causal pathways explicitly (decreased volume → decreased CO → decreased pressure)</li>
                    <li>Uses precise terminology with numerical values</li>
                    <li>Distinguishes between local and systemic effects</li>
                    <li>Addresses all parts of the question systematically</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setFeedback(null);
              setShowExpert(false);
              setCurrentHint(null);
              setHintsRequested(0);
            }}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            ✏️ Revise Your Explanation
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">💡 How to Use This Tool:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Read the learning content carefully</li>
          <li>Write your explanation in your own words (don't just paraphrase!)</li>
          <li>Click "Get AI Feedback" to receive personalized analysis</li>
          <li>Review the feedback and compare with the expert explanation</li>
          <li>Revise your explanation to deepen your understanding</li>
        </ol>
        <p className="mt-4 text-sm text-gray-600">
          <strong>Tip:</strong> The AI analyzes your specific explanation to identify strengths, misconceptions, and gaps. The more thoughtful your explanation, the more useful the feedback!
        </p>
      </div>
    </div>
  );
};

export default AIPoweredSelfExplanation;
