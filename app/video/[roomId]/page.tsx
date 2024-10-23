"use client";

import { useEffect } from "react";
import usePeer from "@/hooks/usePeer";
import { useSocket } from "@/context/VideoSocketContext";
import userMediaStream from "@/hooks/useMediaStream";
import VideoPlayer from "@/components/videoPlayer/videoPlayer";
import useVideoPlayer from "@/hooks/useVideoPlayer";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophoneSlash,
  faPeopleGroup,
  faVideoSlash,
  faDisplay,
  faHand,
  faPhoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import styles from "@/styles/video.module.css";
import { useParams } from "next/navigation";

interface Player {
  url: MediaStream;
  muted: boolean;
  playing: boolean;
}

const Room: React.FC = () => {
  const { socket } = useSocket();
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const { peer, myId } = usePeer();
  const { stream } = userMediaStream();
  const { players, setPlayers, myPlayer, otherPlayers } = useVideoPlayer(myId, roomId);

  useEffect(() => { 
    console.log('my roomId is ', roomId)
    if (!socket || !peer || !stream) return;
    const handleUserConnected = (newUser: string) => {
      console.log("user connected with userId", newUser);
      const call = peer.call(newUser, stream);

      call.on("stream", (incomingStream) => {
        console.log("Incoming stream from someOne", incomingStream);
        if (!myId) return;
        console.log("Setting my stream", myId);
        setPlayers((prev) => ({
          ...prev,
          [myId]: {
            url: stream,
            muted: true,
            playing: true,
          },
        }));
      });
    };
    socket.on("userConnected", handleUserConnected);
    return () => {
      socket.off("userConnected", handleUserConnected);
    };
  }, [peer, socket, stream, myId, setPlayers]);

  useEffect(() => {
    if (!peer || !stream) return;
    console.log("this is my peerId", peer);
    peer.on("call", (call) => {
      const { peer: callerId } = call;
      call.answer(stream);

      call.on("stream", (incomingStream) => {
        console.log("Incoming stream from someone.", callerId);
        console.log("Incoming stream from someOne", incomingStream);
        setPlayers((prev) => ({
          ...prev,
          [callerId]: {
            url: incomingStream,
            muted: true,
            playing: true,
          },
        }));
      });
    });
  }, [peer, stream, setPlayers]);

  useEffect(() => {
    if (!stream || !myId) return;
    console.log("Setting my stream", myId);
    setPlayers((prev) => ({
      ...prev,
      [myId]: {
        url: stream,
        muted: true,
        playing: true,
      },
    }));
  }, [myId, setPlayers, stream]);

  console.log("setting up stream and this is the stream.", stream);
  console.log(`my peer id is ${myId}`);
  console.log(`my socket id is ${socket?.id}`);

  return (
    <div className={styles.mainBox}>
      <div className={styles.videoBox}>
        <div className={styles.group}>
          {!players ? (
            <div>Loading...</div>
          ) : (
            <>
              {myPlayer && (
                <div className={styles.videoComponent}>
                  <VideoPlayer
                    key={myId}
                    url={myPlayer.url}
                    muted={myPlayer.muted}
                    playing={myPlayer.playing}
                    playerId={myId}
                  />
                </div>
              )}
              
              {Object.entries(otherPlayers).map(([playerId, player]) => (
                <div key={playerId} className={styles.videoComponent}>
                  <VideoPlayer
                    url={player.url}
                    muted={player.muted}
                    playing={player.playing}
                    playerId={playerId}
                  />
                </div>
              ))}
            </>
          )}
        </div>

        <div className={styles.controls}>
          <button className={styles.controlButton}>
            <FontAwesomeIcon icon={faMicrophoneSlash} />
          </button>
          <button className={styles.controlButton}>
            <FontAwesomeIcon icon={faPeopleGroup} />
          </button>
          <button className={styles.controlButton}>
            <FontAwesomeIcon icon={faVideoSlash} />
          </button>
          <button className={styles.controlButton}>
            <FontAwesomeIcon icon={faDisplay} />
          </button>
          <button className={styles.controlButton}>
            <FontAwesomeIcon icon={faHand} />
          </button>
          <button className={styles.controlButton}>
            <FontAwesomeIcon icon={faPhoneSlash} />
          </button>
        </div>
      </div>
      <div className={styles.chatBox}>
        <div className={styles.chat}>chat</div>
        <div className={styles.host}>Host</div>
      </div>
    </div>
  );
};

export default Room;