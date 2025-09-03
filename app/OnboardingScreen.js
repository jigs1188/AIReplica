import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const OnboardingScreen = () => {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      router.replace("/login"); // Proceed to login (or another screen) when done
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.content}>
            <Image
              source={require("../assets/images/logo.jpg")}
              style={styles.image}
            />
            <Text style={styles.title}>Welcome to AIReplica</Text>
            <Text style={styles.subtitle}>
              Your personal digital clone to simplify routine tasks.
            </Text>
          </View>
        );
      case 2:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Train Your Clone</Text>
            <Text style={styles.subtitle}>
              Provide examples of how you communicate to fine-tune your clone.
            </Text>
          </View>
        );
      case 3:
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Stay Organized</Text>
            <Text style={styles.subtitle}>
              Access meeting memories, conversation logs, and more—all in one place.
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={["#6A0572", "#AB47BC", "#E1BEE7"]}
      style={styles.container}
    >
      {renderContent()}
      <View style={styles.navigation}>
        {step > 1 && (
          <TouchableOpacity onPress={handleBack} style={styles.navButton}>
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.navButton, { backgroundColor: "#fff" }]}
        >
          <Text
            style={[styles.navButtonText, { color: "#6A0572" }]}
          >
            {step === 3 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    marginBottom: 40,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  navigation: {
    flexDirection: "row",
    width: "80%",
    justifyContent: "space-between",
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#6A0572",
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default OnboardingScreen;
