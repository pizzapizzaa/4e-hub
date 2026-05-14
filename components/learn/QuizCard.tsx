import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { QuizQuestion } from '@/types';

interface Props {
  question: QuizQuestion;
  questionNumber: number;
  selectedIndex: number | null;
  isCorrect?: boolean;
  onSelect: (idx: number) => void;
}

export function QuizCard({ question, questionNumber, selectedIndex, isCorrect, onSelect }: Props) {
  const answered = selectedIndex !== null;

  return (
    <View style={styles.card}>
      <Text style={styles.number}>Question {questionNumber}</Text>
      <Text style={styles.questionText}>{question.question}</Text>

      {question.options.map((option, idx) => {
        let bg = '#F9FAFB';
        if (answered && idx === selectedIndex) {
          bg = isCorrect ? '#D1FAE5' : '#FEE2E2';
        }
        if (answered && idx === question.correctIndex) {
          bg = '#D1FAE5';
        }

        return (
          <TouchableOpacity
            key={idx}
            style={[styles.option, { backgroundColor: bg }]}
            onPress={() => !answered && onSelect(idx)}
            disabled={answered}
          >
            <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        );
      })}

      {answered && question.explanation ? (
        <Text style={styles.explanation}>💡 {question.explanation}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  number: { fontSize: 12, color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  questionText: { fontSize: 17, fontWeight: '700', color: '#222' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  optionLetter: { fontSize: 14, fontWeight: '800', color: '#0F2D5A', width: 20 },
  optionText: { flex: 1, fontSize: 15, color: '#333' },
  explanation: { fontSize: 13, color: '#555', fontStyle: 'italic', marginTop: 4 },
});
