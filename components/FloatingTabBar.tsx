import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export const FloatingTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = useWindowDimensions();

  // Calculate tab width accounting for container padding (16px on each side = 32px total)
  const tabCount = state.routes.length;
  const containerWidth = windowWidth - 32; // Subtract horizontal padding
  const tabWidth = containerWidth / tabCount;

  useEffect(() => {
    // Animate indicator to current tab position
    Animated.spring(indicatorPosition, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [state.index, indicatorPosition]);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 24,
        paddingHorizontal: 16,
      }}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderRadius: 32,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
            height: 64,
            position: "relative",
          }}
        >
          {/* Animated Indicator Background */}
          <Animated.View
            style={{
              position: "absolute",
              height: 52,
              width: tabWidth - 16, // Slightly smaller than tab for padding
              left: 8, // Initial offset for padding
              borderRadius: 26,
              backgroundColor: "rgba(59, 130, 246, 0.2)", // blue-500/20
              transform: [
                {
                  translateX: indicatorPosition.interpolate({
                    inputRange: [0, tabCount - 1],
                    outputRange: [0, (tabCount - 1) * tabWidth],
                  }),
                },
              ],
            }}
          />

          {/* Tab Buttons */}
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  zIndex: 10,
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  {options.tabBarIcon?.({
                    color: isFocused ? "#3D88F7" : "#9CA3AF",
                    size: 24,
                    focused: isFocused,
                  })}
                  <Text
                    style={{
                      color: isFocused ? "#3D88F7" : "#9CA3AF",
                      fontSize: 12,
                      fontWeight: "500",
                    }}
                  >
                    {options.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};
