"use client";
import React, { useState } from "react";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  Box,
  Checkbox,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import ReactMarkdown from "react-markdown";
import "../app/globals.css";

const UserForm = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [score, setScore] = useState(0);
  const [userInfo, setUserInfo] = useState({
    name: "",
    yearOfStudy: "",
    regNo: "",
    domain: "",
    topics: [],
  });
  const [questions, setQuestions] = useState([]);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const areaToSkills = {
    "Frontend Development": ["React", "HTML", "CSS"],
    "Backend Development": ["Node.js", "Golang"],
    "Full Stack Development": ["React", "Node.js", "HTML", "CSS", "Javascript"],
    "Mobile Development": ["React Native"],
    "UI/UX Design": ["Figma"],
    "Generative AI": [
      "Python",
      "Javascript",
      "React",
      "Next JS",
      "SQL",
      "Node JS",
    ],
  };

  const handleTopicChange = (topic) => {
    setUserInfo((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleProceedToTest = async () => {
    setMessages([
      {
        role: "user",
        content: JSON.stringify({
          Name: userInfo.name,
          Reg_No: userInfo.regNo,
          Year_of_Study: userInfo.yearOfStudy,
          Domain: userInfo.areaOfInterest,
          Topics: userInfo.topics,
        }),
      },
    ]);
    setIsTestStarted(true);
    await fetchQuestion();
  };

  // Add this inside your UserForm component, before the return statements
  const getSectionName = (questionNumber) => {
    if (questionNumber >= 1 && questionNumber <= 5)
      return "Section A - Life Skills";
    if (questionNumber >= 6 && questionNumber <= 10)
      return "Section B - Logical Reasoning";
    if (questionNumber >= 11 && questionNumber <= 20)
      return "Section C - C Programming";
    if (questionNumber >= 21 && questionNumber <= 35)
      return `Section D - ${userInfo.domain}`;
    return "Final Assessment";
  };

  const fetchQuestion = async (userDataOrAnswer) => {
    try {
      setIsLoading(true);

      const requestBody = {
        questions,
        questionNumber,
        messages: [
          ...messages,
          {
            role: "user",
            content: JSON.stringify(userDataOrAnswer || userInfo),
          },
        ],
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Network response error");

      const data = await response.json();

      if (questionNumber === 35) {
        setFinalResult(data.result);
        if (
          data.result.feedbackForPreviousQuestion.toLowerCase() == "correct"
        ) {
          setScore(score + 1);
        }
      } else {
        const {
          question,
          options = [],
          feedbackForPreviousQuestion,
          codeSnippet,
        } = data.result;
        if (feedbackForPreviousQuestion.toLowerCase() == "correct") {
          setScore(score + 1);
        }
        setCurrentQuestion({
          question,
          options,
          codeSnippet,
          feedbackForPreviousQuestion,
        });

        setQuestionNumber(questionNumber + 1);

        // Constructing the message
        const feedbackMessage =
          feedbackForPreviousQuestion &&
          feedbackForPreviousQuestion !== "null" &&
          feedbackForPreviousQuestion !== "Null"
            ? feedbackForPreviousQuestion
            : "";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: JSON.stringify({
              questionNumber: questionNumber,
              question: question,
              options: options,
              feedbackForPreviousQuestion: feedbackForPreviousQuestion,
              codeSnippet: codeSnippet,
              currentScore: score,
            }),
          },
        ]);
        setQuestions([
          ...questions,
          { question: question, codeSnippet: codeSnippet, options: options },
        ]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAnswer) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: JSON.stringify({ selectedAnswer: selectedAnswer }),
      },
    ]);
    await fetchQuestion(selectedAnswer);
    setSelectedAnswer("");
  };

  if (finalResult) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: 600,
            width: "100%",
            boxShadow: theme.shadows[3],
            borderRadius: 4,
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: "primary.main",
                textAlign: "center",
                mb: 4,
              }}
            >
              Assessment Results
            </Typography>

            <Grid container spacing={3}>
              <ResultItem title="Score" value={score} />
              <ResultItem title="Category" value={finalResult.category} />
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Areas to Improve:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {finalResult.areasToImprove}
                </Typography>
              </Grid>
              {finalResult.category !== "Not Qualified" && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Next Task:
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {finalResult.Task}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!isTestStarted) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: 600,
            width: "100%",
            boxShadow: theme.shadows[3],
            borderRadius: 4,
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                fontWeight: 700,
                textAlign: "center",
                color: "primary.main",
              }}
            >
              Student Registration
            </Typography>

            <Grid container spacing={3}>
              <FormField
                label="Full Name"
                value={userInfo.name}
                onChange={(e) =>
                  setUserInfo((p) => ({ ...p, name: e.target.value }))
                }
              />

              <FormField
                label="Registration Number"
                value={userInfo.regNo}
                onChange={(e) =>
                  setUserInfo((p) => ({ ...p, regNo: e.target.value }))
                }
              />

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 600 }}>
                    Year of Study
                  </FormLabel>
                  <Select
                    value={userInfo.yearOfStudy}
                    onChange={(e) =>
                      setUserInfo((p) => ({
                        ...p,
                        yearOfStudy: e.target.value,
                      }))
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    {[1, 2, 3, 4].map((year) => (
                      <MenuItem key={year} value={String(year)}>
                        Year {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <FormLabel sx={{ mb: 1, fontWeight: 600 }}>Domain</FormLabel>
                  <Select
                    value={userInfo.domain}
                    onChange={(e) => {
                      setUserInfo((p) => ({
                        ...p,
                        domain: e.target.value,
                        // Reset topics when area changes
                        topics: p.topics.filter((topic) =>
                          areaToSkills[e.target.value].includes(topic)
                        ),
                      }));
                    }}
                    sx={{ borderRadius: 2 }}
                  >
                    {[
                      "Frontend Development",
                      "Backend Development",
                      "Full Stack Development",
                      "Mobile Development",
                      "UI/UX Design",
                      "Generative AI",
                    ].map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                    Technical Skills
                  </FormLabel>
                  {userInfo.domain ? (
                    <FormGroup row sx={{ gap: 2 }}>
                      {areaToSkills[userInfo.domain]?.map((topic) => (
                        <FormControlLabel
                          key={topic}
                          control={
                            <Checkbox
                              checked={userInfo.topics.includes(topic)}
                              onChange={() => handleTopicChange(topic)}
                              size="small"
                            />
                          }
                          label={topic}
                          sx={{ m: 0 }}
                        />
                      ))}
                    </FormGroup>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Please select a Domain to view relevant skills
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleProceedToTest}
                  disabled={
                    !userInfo.name ||
                    !userInfo.regNo ||
                    !userInfo.yearOfStudy ||
                    !userInfo.domain ||
                    userInfo.topics.length === 0
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: 16,
                  }}
                >
                  Start Assessment
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      {currentQuestion ? ( // Only show if currentQuestion exists
        <Card
          sx={{
            maxWidth: 800,
            width: "100%",
            boxShadow: theme.shadows[3],
            borderRadius: 4,
          }}
        >
          <CardContent>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: "text.secondary",
                mb: 1,
              }}
            >
              {getSectionName(questionNumber)}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 400,
                color: "text.secondary",
                mb: 1,
                fontSize: 20,
              }}
            >
              Question {questionNumber}/35
            </Typography>

            <LinearProgress
              variant="determinate"
              value={(questionNumber / 35) * 100}
              sx={{ height: 6, borderRadius: 3, mb: 3 }}
            />

            {currentQuestion?.feedbackForPreviousQuestion &&
              !["null", "none", "not applicable"].includes(
                currentQuestion.feedbackForPreviousQuestion.toLowerCase()
              ) && (
                <Box
                  sx={{
                    bgcolor: "#F2EFE7",
                    borderRadius: 2,
                    p: 2,
                    mb: 3,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 250 }}>
                    {currentQuestion.feedbackForPreviousQuestion}
                  </Typography>
                </Box>
              )}

            <Typography variant="h6" sx={{ mb: 3, fontWeight: 300 }}>
              <ReactMarkdown>{currentQuestion?.question}</ReactMarkdown>
            </Typography>

            {currentQuestion.codeSnippet &&
              !["", "null", "none"].includes(currentQuestion.codeSnippet) && (
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 300 }}>
                  <SyntaxHighlighter language="Javascript" style={atomDark}>
                    {currentQuestion.codeSnippet}
                  </SyntaxHighlighter>
                </Typography>
              )}

            <form onSubmit={handleSubmit}>
              {currentQuestion?.options?.length > 0 ? (
                <RadioGroup
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  sx={{ gap: 1.5 }}
                >
                  {currentQuestion.options.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={<Typography variant="body2">{option}</Typography>}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        m: 0,
                      }}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!selectedAnswer || isLoading}
                sx={{
                  mt: 3,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: 16,
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Submit Answer "
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        // Show loading state or empty state when no question is generated
        <CircularProgress />
      )}
    </Box>
  );
};

// Helper components
const ResultItem = ({ title, value }) => (
  <Grid item xs={6}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
      {title}
    </Typography>
    <Typography variant="h6" color="primary">
      {value}
    </Typography>
  </Grid>
);

const FormField = ({ label, value, onChange }) => (
  <Grid item xs={12}>
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      variant="outlined"
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
        },
      }}
    />
  </Grid>
);

export default UserForm;
