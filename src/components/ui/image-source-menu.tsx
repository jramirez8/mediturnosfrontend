import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

interface ImageSourceMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
}

export function ImageSourceMenu({ visible, onClose, onSelectGallery, onSelectCamera }: ImageSourceMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content}>
          <View style={styles.handle} />
          <Text style={styles.title}>Seleccionar imagen</Text>

          <View style={styles.options}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onSelectGallery();
                onClose();
              }}
            >
              <View style={styles.iconBox}>
                <SymbolView name="photo.on.rectangle" size={24} tintColor="#9333ea" />
              </View>
              <Text style={styles.optionText}>Galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onSelectCamera();
                onClose();
              }}
            >
              <View style={styles.iconBox}>
                <SymbolView name="camera.fill" size={24} tintColor="#9333ea" />
              </View>
              <Text style={styles.optionText}>Cámara</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  options: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#ede9fe',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f3f4f6',
    borderRadius: 16,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
});
