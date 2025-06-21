import React from "react";
import { BottomNavigation } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { MaterialCommunityIcons as IconType } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export default function BottomNavbar({ state, navigation }: BottomTabBarProps) {
  return (
    <BottomNavigation.Bar
      navigationState={state}
      safeAreaInsets={{ bottom: 0 }}
      onTabPress={({ route }) => navigation.navigate(route.name)}
      renderIcon={({ route, color }) => {
        const icons: { [key: string]: keyof typeof IconType.glyphMap } = {
          Home: "home",
          History: "history",
          Settings: "cog",
          Dashboard: "view-dashboard",
        };

        return (
          <MaterialCommunityIcons
            name={icons[route.name]}
            size={24}
            color={color}
          />
        );
      }}
      getLabelText={({ route }) => route.name}
      style={{ backgroundColor: "#ffffff" }}
    />
  );
}
