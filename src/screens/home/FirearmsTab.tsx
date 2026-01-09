import React from "react";
import { View, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../app/App";
import { FirearmStorage } from "../../validation/storageSchemas";
import { TerminalText, FirearmImage } from "../../components";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

type Props = {
  firearms: FirearmStorage[];
  onRefresh: () => void;
  refreshing: boolean;
};

export const FirearmsTab = ({
  firearms,
  onRefresh,
  refreshing,
}: Props) => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const renderFirearmItem = ({ item }: { item: FirearmStorage }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("FirearmDetails", { id: item.id })}
      className="bg-terminal-bg border-2 border-terminal-border p-4 mb-4"
    >
      <View className="flex-row items-start">
        <FirearmImage photoUri={item.photos?.[0]} size={60} className="mr-4" />
        <View className="flex-1 flex-row flex-wrap">
          <View className="w-1/2 pr-2">
            <TerminalText className="text-lg" numberOfLines={1}>
              {item.modelName} ({item.caliber})
            </TerminalText>
          </View>
          <View className="w-1/2 items-end">
            <TerminalText>{item.roundsFired} rounds</TerminalText>
          </View>
          <View className="w-1/2 pr-2 mt-1">
            <TerminalText>
              Added: {new Date(item.createdAt).toLocaleDateString()}
            </TerminalText>
          </View>
          <View className="w-1/2 items-end justify-end">
            <TerminalText className="text-lg">{">"}</TerminalText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={firearms}
      renderItem={renderFirearmItem}
      keyExtractor={(item) => item.id}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        <View className="flex-1 justify-center items-center mt-8">
          <TerminalText>NO FIREARMS FOUND</TerminalText>
        </View>
      }
    />
  );
};