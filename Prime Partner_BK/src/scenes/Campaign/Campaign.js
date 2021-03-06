import React, { useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ToastAndroid,
  Image,
  ActivityIndicator,
} from "react-native";
import Modal from "react-native-modal";
import orm from "src/data";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import ImagePicker from "react-native-image-picker";
import { getState } from "src/storeHelper";
import { drlUrl } from "../Constants/Constants";

const convert = require("xml-js");

const SCREEN_HEIGHT = Dimensions.get("screen").height;

const Campaign = ({ navigation }) => {
  const [image, setImage] = React.useState(null);
  const [campId, setCampId] = React.useState(undefined);
  const [imageData, setImageData] = React.useState(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [campaignDetails, setCampaignDetails] = React.useState(null);

  useEffect(() => {
    const campId = navigation.getParam("campId");
    setCampId(campId);
  }, []);

  const selectPhotoTapped = () => {
    const options = {
      quality: 1.0,
      maxWidth: 500,
      maxHeight: 500,
      storageOptions: {
        skipBackup: true,
      },
    };

    ImagePicker.showImagePicker(options, (response) => {
      if (response.error) {
        ToastAndroid.showWithGravity(
          "ImagePicker Error: ",
          response.error,
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
      }
      if (response.didCancel) {
        ToastAndroid.showWithGravity(
          "User cancelled picker!",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
      } else {
        const source = { uri: response.data };
        const imageBase64 = { uri: "data:image/png;base64," + response.data };
        setImage(source);
        setImageData(imageBase64);
      }
    });
  };

  const submitImage = () => {
    if (!image) {
      ToastAndroid.showWithGravity(
        "Please Select an Image",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }
    setIsLoading(true);
    const dbState = getState().data;
    const sess = orm.session(dbState);
    if (sess.User.idExists(0)) {
      const User = sess.User.withId(0);
      const { ChemistCardNo } = User.ref;

      const imageDetails = {
        image: image,
      };

      const imageBody = Object.keys(imageDetails)
        .map(
          (key) =>
            encodeURIComponent(key) +
            "=" +
            encodeURIComponent(imageDetails[key])
        )
        .join("&");

      fetch("http://primepartner.fbmdigital.in/index.php", {
        method: "POST",
        body: imageBody,
        headers: {
          Accept: "multipart/form-data",
        },
      })
        .then((res) => {
          const details = {
            user: "DRL_API",
            password: "3JA2ASJx^7",
            MemberLogin: ChemistCardNo,
            CampaignID: campId,
            ImageURL: res.url,
          };

          // const Body = Object.keys(details)
          // .map(
          //   (key) =>
          //     encodeURIComponent(key) + "=" + encodeURIComponent(details[key])
          // )
          // .join("&");

          const Body = new FormData();
          Body.append("user", "DRL_API");
          Body.append("password", "3JA2ASJx^7");
          Body.append("MemberLogin", JSON.stringify(ChemistCardNo));
          Body.append("CampaignID", JSON.stringify(campId));
          Body.append("ImageURL", res.url);
          const options = {
            method: "POST",
            body: Body,
            headers: {
              Accept: "multipart/form-data",
              "Content-Type": "application/json",
            },
          };

          fetch(drlUrl + "/StoreCampaignImages", options)
            .then((res) => res)
            .then((res) => {
              console.warn("StoreCampaignImages:", res);
              // const xml = convert.xml2json(res, {
              //   compact: true,
              //   spaces: 4,
              // });
              //const parsedXml = JSON.parse(xml);
              const parsedXml = res;
              // console.log('parsedXml', parsedXml);
              /*<----------------Check Further---------------------->*/
              if (parsedXml.string._text) {
                navigation.navigate("CampaignList");
                alert("Image uploaded successfully!");
              } else {
                alert("Image failed to upload!");
              }
              setIsLoading(false);
            })
            .catch((err) => {
              setIsLoading(false);
              console.log("error:", err);
              Alert.alert(
                "Prime Partner",
                err.message,
                [{ text: "OK", onPress: () => console.log("OK Pressed") }],
                { cancelable: false }
              );
            });
        })
        .catch((err) => {
          alert("StoreCampaignImages api failed!");
          console.log(err.message);
        });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#522e90" barStyle="light-content" />

        <View style={styles.header}>
          <Text
            onPress={() => navigation.navigate("HomeTAB")}
            style={styles.headerBackText}
          >
            Back
          </Text>
          <Text style={styles.headerCenterText}>Campaign</Text>
          <Text
            onPress={() => (image ? setIsVisible(true) : null)}
            style={[
              styles.previewText,
              image ? { color: "#fff" } : { color: "#666666" },
            ]}
          >
            Preview
          </Text>
        </View>

        <View style={styles.body}>
          <View style={styles.uploadButtonWrapper}>
            <TouchableOpacity
              onPress={() => selectPhotoTapped()}
              activeOpacity={0.6}
              style={styles.clickImage}
            >
              <MaterialIcons name="camera" size={30} color="#522e90" />
              <Text style={styles.uploadText}>Click to Upload Image</Text>
            </TouchableOpacity>
          </View>

          <If condition={image}>
            <Text style={styles.description}>
              Preview is available at top right corner
            </Text>
          </If>

          <View style={styles.submitButtonWrapper}>
            <TouchableOpacity
              onPress={() => submitImage()}
              activeOpacity={0.6}
              style={styles.button}
            >
              <If condition={isLoading}>
                <ActivityIndicator color="#fff" size="small" />
                <Else />
                <MaterialIcons name="send" size={25} color="#fff" />
              </If>
              <Text style={styles.submitText}>SUBMIT</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal
          isVisible={isVisible}
          avoidKeyboard={true}
          backdropOpacity={0.2}
          style={styles.modal}
          onBackButtonPress={() => setIsVisible(false)}
          onBackdropPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContentWrapper}>
            <View style={styles.modalHeaderWrapper}>
              <MaterialIcons
                onPress={() => setIsVisible(false)}
                style={styles.backIcon}
                name="arrow-back"
                size={25}
                color="#522e90"
              />
              <Text style={styles.imagePreviewText}>Image Preview</Text>
              <View></View>
            </View>

            <View style={styles.imageWrapper}>
              <Image
                resizeMode="contain"
                style={styles.image}
                source={imageData}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: SCREEN_HEIGHT * 0.05,
    backgroundColor: "#522e90",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerBackText: {
    color: "#fff",
    marginLeft: 15,
  },
  headerCenterText: {
    color: "#fff",
  },
  previewText: {
    marginRight: 15,
  },
  body: {
    flex: 1,
    marginHorizontal: 20,
  },
  uploadButtonWrapper: {
    flex: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    color: "#522e90",
    textAlign: "center",
  },
  submitButtonWrapper: {
    flex: 6,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  clickImage: {
    height: 120,
    width: 120,
    borderWidth: 1,
    borderColor: "#522e90",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  button: {
    height: 50,
    width: "100%",
    backgroundColor: "#522e90",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#522e90",
    borderRadius: 5,
    elevation: 1,
  },
  uploadText: {
    textAlign: "center",
    paddingHorizontal: 5,
    color: "#522e90",
    marginTop: 12,
  },
  submitText: {
    color: "#fff",
    fontWeight: "300",
    fontSize: 18,
    fontStyle: "normal",
    marginLeft: 12,
  },
  modal: {
    margin: 0,
    padding: 0,
  },
  modalContentWrapper: {
    flex: 1,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "#fff",
  },
  modalHeaderWrapper: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#efefef",
    elevation: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  imagePreviewText: {
    color: "#522e90",
    fontSize: 18,
    fontWeight: "200",
    marginVertical: 8,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  image: {
    flex: 1,
    width: "90%",
    height: "90%",
    borderRadius: 5,
  },
  backIcon: {
    marginLeft: 12,
  },
});

export default Campaign;
