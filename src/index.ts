import Base64 from "./audio/codecs/Base64";
import CallService from "./core/CallService";
import Ieee from "./audio/codecs/Ieee";
import Mulaw from "./audio/codecs/Mulaw";

// Exporting these because they have potentially independent value.
export { Base64, Ieee, Mulaw }

// This is probably what most people are looking for.
export default CallService;