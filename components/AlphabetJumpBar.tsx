import React, { useEffect, useRef } from 'react';
import { Animated, GestureResponderEvent, PanResponder, StyleSheet, Text, View } from 'react-native';

const LETTER_HEIGHT = 18; // Increased slightly for better touch target

export interface AlphabetJumpBarProps {
    onLetterPress: (letter: string) => void;
    visible?: boolean;
    alphabets: string[]; // Dynamic alphabets
}

const AlphabetJumpBar: React.FC<AlphabetJumpBarProps> = ({ onLetterPress, visible = true, alphabets }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    const handleTouch = (evt: GestureResponderEvent) => {
        const { locationY } = evt.nativeEvent;
        // Since we are wrapping content deeply, the touch is on the container.
        // Assuming the list starts from top of container or aligned bottom?
        // Container style says "justifyContent: flex-end".
        // This means the stack of letters is at the BOTTOM.
        // LocationY is relevant to the Container top.
        // This is tricky. 
        // If we want reliable touch, we should make the container wrap strictly around the letters?
        // Or calculate offset based on (Layout Height - List Height).
        // Let's simplify: Align Top but position container at Bottom-Right via "top: auto, bottom: 80".
        // Then LocationY starts from 0 at the first letter.

        const index = Math.floor(locationY / LETTER_HEIGHT);

        if (index >= 0 && index < alphabets.length) {
            onLetterPress(alphabets[index]);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: (evt) => handleTouch(evt),
            onPanResponderMove: (evt) => handleTouch(evt),
        })
    ).current;

    // If no alphabets, render nothing
    if (!alphabets || alphabets.length === 0) return null;

    return (
        <Animated.View
            style={[styles.container, { opacity }]}
            {...panResponder.panHandlers}
        >
            <View style={styles.listContainer}>
                {alphabets.map((letter) => (
                    <View key={letter} style={{ height: LETTER_HEIGHT, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                        <Text style={styles.letter}>{letter}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 1, // Moved closer to right edge
        bottom: 80, // Positioned at bottom right area
        top: 'auto', // Allow it to be flexible height
        justifyContent: 'flex-start', // Start from top of container (which is bottom-aligned to screen)
        alignItems: 'center', // Center content in the container
        paddingRight: 0,
        zIndex: 2000,
        elevation: 10,
        width: 30, // Slightly reduced width closer to original
    },
    listContainer: {
        backgroundColor: 'transparent',
        alignItems: 'center', // Center letters
        width: '100%',
    },
    letter: {
        fontSize: 11,
        fontWeight: '900',
        color: '#004e92',
        height: LETTER_HEIGHT,
        textAlignVertical: 'center',
    }
});

export default AlphabetJumpBar;
