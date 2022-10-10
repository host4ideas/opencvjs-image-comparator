/**
 * Inputs two images and shows a result image if a canvas or img element is provided.
 * @param {Object} cv OpenCV loaded object
 * @param {String} imgInput1 An image
 * @param {String} imgInput2 An image
 * @param {String} canvasResult An img or canvas HTML Element
 */
async function imageComparator(cv, imgInput1, imgInput2, canvasResult = null) {
    const img1Original = cv.imread(imgInput1);
    const img2Original = cv.imread(imgInput2);

    /*
		Optimize images
	*/
    // Transform color to gray
    const img1Gray = new cv.Mat();
    const img2Gray = new cv.Mat();
    cv.cvtColor(img1Original, img1Gray, cv.COLOR_RGBA2GRAY, 0);
    cv.cvtColor(img2Original, img2Gray, cv.COLOR_RGBA2GRAY, 0);

    // Transform to RGB, Opencv likes RGB
    const img1RGB = new cv.Mat();
    cv.cvtColor(img1Original, img1RGB, cv.COLOR_RGBA2RGB, 0);

    const img2RGB = new cv.Mat();
    cv.cvtColor(img2Original, img2RGB, cv.COLOR_RGBA2RGB, 0);

    // Transform sizes
    const img1 = new cv.Mat();
    const img2 = new cv.Mat();
    const dsize = new cv.Size(300, 300);
    cv.resize(img1RGB, img1, dsize, 0, 0, cv.INTER_AREA);
    cv.resize(img2RGB, img2, dsize, 0, 0, cv.INTER_AREA);

    /* 
		Initiate ORB detector 
	*/
    const orb = new cv.ORB();

    // find the keypoints with ORB
    const keyPoints1 = new cv.KeyPointVector();
    const keyPoints2 = new cv.KeyPointVector();
    orb.detect(img1, keyPoints1, new cv.Mat());
    orb.detect(img2, keyPoints2, new cv.Mat());

    // compute the descriptors with ORB
    const descriptors1 = new cv.Mat();
    const descriptors2 = new cv.Mat();
    orb.compute(img1, keyPoints1, descriptors1);
    orb.compute(img2, keyPoints2, descriptors2);

    /*
		 Match using the BFMatcher with crossCheck true
	*/
    const bf = new cv.BFMatcher(cv.NORM_HAMMING);
    const matches = new cv.DMatchVectorVector();

    console.log("test");

    try {
        // match the feature descriptors
        bf.knnMatch(descriptors1, descriptors2, matches, 2);
    } catch (error) {
        console.log(error, "test");
    }

    console.log("test");

    /*
    	Apply ratio test by D.Lowe and filter good results
    */
    const knnDistanceOption = 0.7;
    const goodMatches = new cv.DMatchVector();
    let counter = 0;
    for (let i = 0; i < matches.size(); ++i) {
        const match = matches.get(i);
        const dMatch1 = match.get(0);
        const dMatch2 = match.get(1);
        //console.log("[", i, "] ", "dMatch1: ", dMatch1, "dMatch2: ", dMatch2);
        if (
            dMatch1.distance <=
            dMatch2.distance * parseFloat(knnDistanceOption)
        ) {
            console.log(
                "***Good Match***",
                "dMatch1.distance: ",
                dMatch1.distance,
                "was less than or = to: ",
                "dMatch2.distance * parseFloat(knnDistanceOption)",
                dMatch2.distance * parseFloat(knnDistanceOption),
                "dMatch2.distance: ",
                dMatch2.distance,
                "knnDistance",
                knnDistanceOption
            );
            goodMatches.push_back(dMatch1);
            counter++;
        }
    }

    console.log(
        "keeping ",
        counter,
        " points in goodMatches vector out of ",
        matches.size(),
        " contained in this match vector:",
        matches
    );
    console.log("here are first 5 matches");
    for (let t = 0; t < matches.size(); ++t) {
        console.log("[" + t + "]", "matches: ", matches.get(t));
        if (t === 5) {
            break;
        }
    }

    console.log("here are first 5 goodMatches");
    for (let r = 0; r < goodMatches.size(); ++r) {
        console.log("[" + r + "]", "goodMatches: ", goodMatches.get(r));
        if (r === 5) {
            break;
        }
    }

    const matchingImage = new cv.Mat();

    /**
     * img1	First source image.
     * keypoints1	Keypoints from the first source image.
     * img2	Second source image.
     * keypoints2	Keypoints from the second source image.
     * matches1to2	Matches from the first image to the second one, which means that keypoints1[i] has a corresponding point in keypoints2[matches[i]] .
     * outImg	Output image. Its content depends on the flags value defining what is drawn in the output image. See possible flags bit values below.
     * matchColor	Color of matches (lines and connected keypoints). If matchColor==Scalar::all(-1) , the color is generated randomly.
     * singlePointColor	Color of single keypoints (circles), which means that keypoints do not have the matches. If singlePointColor==Scalar::all(-1) , the color is generated randomly.
     */
    cv.drawMatches(
        img1,
        keyPoints1,
        img2,
        keyPoints2,
        goodMatches,
        matchingImage
    );

    function deleteAll() {
        [
            img1Original,
            img2Original,
            img1,
            img2,
            keyPoints1,
            keyPoints2,
            descriptors1,
            descriptors2,
            orb,
            matches,
            bf,
        ].forEach((element) => {
            element.delete();
        });
    }

    if (goodMatches.size() >= 0) {
        if (canvasResult) {
            cv.imshow(canvasResult, matchingImage);
        }
        deleteAll();
        return true;
    } else {
        deleteAll();
        return false;
    }
}
