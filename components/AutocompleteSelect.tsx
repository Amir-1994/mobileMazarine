import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { ChevronDown, Search, X } from "lucide-react-native";

interface AutocompleteSelectProps<T> {
  data?: T[];
  fetchData?: (term: string) => Promise<T[]>;
  value: T | null;
  onSelect: (item: T | null) => void;
  placeholder: string;
  displayKey: keyof T;
  searchKeys?: (keyof T)[];
  isLoading?: boolean;
  error?: string;
  renderItem?: (item: T) => React.ReactNode;
}

export function AutocompleteSelect<T extends { id: string }>({
  data,
  fetchData,
  value,
  onSelect,
  placeholder,
  displayKey,
  searchKeys,
  isLoading: externalLoading = false,
  error,
  renderItem,
}: AutocompleteSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchedData, setFetchedData] = useState<T[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const isLoading = externalLoading || internalLoading;

  const filteredData = useMemo(() => {
    if (fetchData) {
      return fetchedData;
    }
    if (!data) return [];
    if (!searchQuery.trim()) return data;

    if (!searchKeys) return data;
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        if (typeof value !== "string" || !value.trim()) return false;
        return value.toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, fetchedData, searchQuery, searchKeys, fetchData]);

  const fetchDataCallback = useCallback(
    async (term: string) => {
      if (!fetchData) return;
      setInternalLoading(true);
      setInternalError(null);
      try {
        const result = await fetchData(term);
        setFetchedData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchedData([]);
        setInternalError("Erreur lors du chargement des données");
      } finally {
        setInternalLoading(false);
      }
    },
    [fetchData]
  );

  useEffect(() => {
    if (fetchData && isOpen) {
      const timeoutId = setTimeout(() => {
        fetchDataCallback(searchQuery);
      }, 500); // debounce
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, fetchData, isOpen, fetchDataCallback]);

  useEffect(() => {
    if (fetchData && isOpen && fetchedData.length === 0) {
      fetchDataCallback("");
    }
  }, [isOpen, fetchData, fetchedData.length, fetchDataCallback]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery("");
  };

  const defaultRenderItem = (item: T) => (
    <View style={styles.defaultItemContainer}>
      <Text style={styles.defaultItemText}>{String(item[displayKey])}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsOpen(true)}
        disabled={isLoading}
      >
        <View style={styles.selectorContent}>
          <Text style={[styles.selectorText, !value && styles.placeholderText]}>
            {value ? String(value[displayKey]) : placeholder}
          </Text>
          <View style={styles.selectorIcons}>
            {value && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color="#666" />
              </TouchableOpacity>
            )}
            {isLoading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <ChevronDown size={20} color="#666" />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    value?.id === item.id && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  {renderItem ? renderItem(item) : defaultRenderItem(item)}
                </TouchableOpacity>
              )}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {internalError
                      ? internalError
                      : isLoading
                      ? "Chargement..."
                      : "Aucun résultat trouvé"}
                  </Text>
                </View>
              }
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e5e9",
    minHeight: 56,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectorError: {
    borderColor: "#ff4757",
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  selectorIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearButton: {
    padding: 4,
  },
  errorText: {
    color: "#ff4757",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  list: {
    maxHeight: 300,
  },
  item: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedItem: {
    backgroundColor: "#e3f2fd",
  },
  defaultItemContainer: {
    flex: 1,
  },
  defaultItemText: {
    fontSize: 16,
    color: "#333",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
